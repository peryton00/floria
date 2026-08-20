"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_js_1 = require("./config/database.js");
const media_worker_js_1 = require("./media/worker/media.worker.js");
const media_service_js_1 = require("./media/media.service.js");
const domain_media_service_js_1 = require("./media/domain-media.service.js");
async function runStage10Verification() {
    console.log("============================================================");
    console.log("FLORIA STAGE 10 — REAL FRONTEND MEDIA INTEGRATION E2E VERIFICATION");
    console.log("============================================================");
    const adminDb = (0, database_js_1.getAdminDb)();
    // 1. Query existing valid seller profile and user from database
    let { data: existingSeller } = await adminDb
        .from("seller_profiles")
        .select("id, user_id")
        .limit(1)
        .maybeSingle();
    if (!existingSeller) {
        // Fetch any row from seller_profiles or users
        const { data: anySeller } = await adminDb.from("seller_profiles").select("*").limit(1).single();
        existingSeller = anySeller;
    }
    if (!existingSeller) {
        throw new Error("Stage 10 verification requires at least 1 existing seller_profile in database.");
    }
    const sellerA = {
        id: existingSeller.user_id,
        email: "sellerA@floria.in",
        role: "seller",
        permissions: [],
        sellerId: existingSeller.id,
    };
    const adminUser = {
        id: existingSeller.user_id,
        email: "admin@floria.in",
        role: "admin",
        permissions: [],
    };
    // Ensure all media storage buckets exist
    try {
        await adminDb.storage.createBucket("media-staging", { public: false });
    }
    catch { }
    try {
        await adminDb.storage.createBucket("public-media", { public: true });
    }
    catch { }
    try {
        await adminDb.storage.createBucket("private-documents", { public: false });
    }
    catch { }
    // 2. Start live MediaWorker
    const worker = new media_worker_js_1.MediaWorker();
    await worker.start();
    console.log("Real MediaWorker active on Upstash Redis queue...");
    // Poll until READY helper
    async function waitForAssetReady(assetId) {
        let attempts = 0;
        while (attempts < 60) {
            const { data: asset } = await adminDb
                .from("media_assets")
                .select("id, status, failure_message, failure_code")
                .eq("id", assetId)
                .maybeSingle();
            if (asset?.status === "READY")
                return;
            if (asset?.status === "FAILED") {
                throw new Error(`Asset '${assetId}' failed processing: [${asset.failure_code}] ${asset.failure_message}`);
            }
            await new Promise((r) => setTimeout(r, 300));
            attempts++;
        }
        throw new Error(`Asset '${assetId}' failed to reach READY status within timeout.`);
    }
    // Creates a valid 1x1 PNG buffer with a unique trailing signature for SHA-256 hash isolation
    function createUniquePngBuffer() {
        const basePng = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc000000301010018dd8db0000000049454e44ae426082", "hex");
        const signature = Buffer.from(`\n// FLORIA_TEST_${Date.now()}_${Math.random()}`);
        return Buffer.concat([basePng, signature]);
    }
    // ------------------------------------------------------------
    // TEST 1: PRODUCT MEDIA UPLOAD -> READY -> ATTACHMENT
    // ------------------------------------------------------------
    console.log("\n--- TEST 1: Product Media Upload -> READY -> Attachment ---");
    const prodImgBuf = createUniquePngBuffer();
    const prodSession = await media_service_js_1.MediaService.createUploadSession(sellerA, {
        profile: "PRODUCT",
        filename: "stage10-plant.png",
        mimeType: "image/png",
        sizeBytes: prodImgBuf.length,
    });
    const { error: upErr1 } = await adminDb.storage.from("media-staging").upload(prodSession.stagingPath, prodImgBuf, { contentType: "image/png", upsert: true });
    if (upErr1) {
        throw new Error(`Storage staging upload failed for Test 1: ${upErr1.message}`);
    }
    const prodComp = await media_service_js_1.MediaService.completeUploadSession(sellerA, prodSession.sessionId);
    console.log("✅ Product Upload Session Completed:", prodComp);
    try {
        await worker.processJob({
            data: {
                assetId: prodComp.assetId,
                sessionId: prodSession.sessionId,
                sellerId: sellerA.sellerId,
                uploadedByUserId: sellerA.id,
                profile: "PRODUCT",
                stagingPath: prodSession.stagingPath,
            },
        });
    }
    catch (wErr) {
        console.error("Worker processJob error:", wErr);
    }
    await waitForAssetReady(prodComp.assetId);
    console.log("✅ Product Image Upload & READY Asset Resolved:", { assetId: prodComp.assetId });
    // ------------------------------------------------------------
    // TEST 2: SELLER LOGO & NURSERY SHOWCASE MEDIA
    // ------------------------------------------------------------
    console.log("\n--- TEST 2: Seller Logo & Nursery Showcase Media ---");
    const logoBuf = createUniquePngBuffer();
    const logoSession = await media_service_js_1.MediaService.createUploadSession(sellerA, {
        profile: "SELLER_LOGO",
        filename: "stage10-logo.png",
        mimeType: "image/png",
        sizeBytes: logoBuf.length,
    });
    await adminDb.storage.from("media-staging").upload(logoSession.stagingPath, logoBuf, { contentType: "image/png", upsert: true });
    const logoComp = await media_service_js_1.MediaService.completeUploadSession(sellerA, logoSession.sessionId);
    await worker.processJob({
        data: {
            assetId: logoComp.assetId,
            sessionId: logoSession.sessionId,
            sellerId: sellerA.sellerId,
            uploadedByUserId: sellerA.id,
            profile: "SELLER_LOGO",
            stagingPath: logoSession.stagingPath,
        },
    });
    await waitForAssetReady(logoComp.assetId);
    const logoRes = await domain_media_service_js_1.DomainMediaService.updateSellerLogo(sellerA, logoComp.assetId);
    console.log("✅ Seller Logo Attached Successfully:", {
        sellerId: sellerA.sellerId,
        logo_asset_id: logoRes.logo_asset_id,
        logo_url: logoRes.logo_url,
    });
    // ------------------------------------------------------------
    // TEST 3: USER AVATAR INTEGRATION
    // ------------------------------------------------------------
    console.log("\n--- TEST 3: User Avatar Integration ---");
    const avatarBuf = createUniquePngBuffer();
    const avatarSession = await media_service_js_1.MediaService.createUploadSession(sellerA, {
        profile: "USER_AVATAR",
        filename: "stage10-avatar.png",
        mimeType: "image/png",
        sizeBytes: avatarBuf.length,
    });
    await adminDb.storage.from("media-staging").upload(avatarSession.stagingPath, avatarBuf, { contentType: "image/png", upsert: true });
    const avatarComp = await media_service_js_1.MediaService.completeUploadSession(sellerA, avatarSession.sessionId);
    await worker.processJob({
        data: {
            assetId: avatarComp.assetId,
            sessionId: avatarSession.sessionId,
            sellerId: sellerA.sellerId,
            uploadedByUserId: sellerA.id,
            profile: "USER_AVATAR",
            stagingPath: avatarSession.stagingPath,
        },
    });
    await waitForAssetReady(avatarComp.assetId);
    const avatarRes = await domain_media_service_js_1.DomainMediaService.updateUserAvatar(sellerA, avatarComp.assetId);
    console.log("✅ User Avatar Attached Successfully:", {
        userId: sellerA.id,
        avatar_asset_id: avatarRes.avatar_asset_id,
        avatar_url: avatarRes.avatar_url,
    });
    // ------------------------------------------------------------
    // TEST 4: ADMIN CATEGORY BANNER INTEGRATION
    // ------------------------------------------------------------
    console.log("\n--- TEST 4: Admin Category Banner Integration ---");
    const { data: cat } = await adminDb.from("categories").select("id, name").limit(1).single();
    if (cat) {
        const bannerBuf = createUniquePngBuffer();
        const bannerSession = await media_service_js_1.MediaService.createUploadSession(adminUser, {
            profile: "CATEGORY",
            filename: "stage10-category.png",
            mimeType: "image/png",
            sizeBytes: bannerBuf.length,
        });
        await adminDb.storage.from("media-staging").upload(bannerSession.stagingPath, bannerBuf, { contentType: "image/png", upsert: true });
        const bannerComp = await media_service_js_1.MediaService.completeUploadSession(adminUser, bannerSession.sessionId);
        await worker.processJob({
            data: {
                assetId: bannerComp.assetId,
                sessionId: bannerSession.sessionId,
                sellerId: null,
                uploadedByUserId: adminUser.id,
                profile: "CATEGORY",
                stagingPath: bannerSession.stagingPath,
            },
        });
        await waitForAssetReady(bannerComp.assetId);
        const categoryRes = await domain_media_service_js_1.DomainMediaService.updateCategoryBanner(adminUser, cat.id, bannerComp.assetId);
        console.log("✅ Category Banner Updated Successfully:", {
            categoryId: cat.id,
            name: cat.name,
            banner_asset_id: categoryRes.banner_asset_id,
            banner_url: categoryRes.banner_url,
        });
    }
    // ------------------------------------------------------------
    // TEST 5: SELLER PRIVATE DOCUMENT SIGNED DOWNLOAD URL
    // ------------------------------------------------------------
    console.log("\n--- TEST 5: Seller Private Document & Signed Download URL ---");
    const pdfBuf = Buffer.from(`%PDF-1.4 Stage 10 Verification Document ${Date.now()}`);
    const docSession = await media_service_js_1.MediaService.createUploadSession(sellerA, {
        profile: "DOCUMENT",
        filename: "gstin-certificate.pdf",
        mimeType: "application/pdf",
        sizeBytes: pdfBuf.length,
    });
    await adminDb.storage.from("media-staging").upload(docSession.stagingPath, pdfBuf, { contentType: "application/pdf", upsert: true });
    const docComp = await media_service_js_1.MediaService.completeUploadSession(sellerA, docSession.sessionId);
    await worker.processJob({
        data: {
            assetId: docComp.assetId,
            sessionId: docSession.sessionId,
            sellerId: sellerA.sellerId,
            uploadedByUserId: sellerA.id,
            profile: "DOCUMENT",
            stagingPath: docSession.stagingPath,
        },
    });
    await waitForAssetReady(docComp.assetId);
    const docRes = await domain_media_service_js_1.DomainMediaService.attachSellerDocument(sellerA, "gstin", docComp.assetId);
    console.log("✅ Seller Document Registered in Private Bucket:", {
        documentId: docRes.id,
        file_asset_id: docRes.file_asset_id,
    });
    const signedUrlRes = await domain_media_service_js_1.DomainMediaService.getSignedDocumentUrl(sellerA, docRes.id);
    console.log("✅ 60-Minute Signed Private Download URL Generated:", signedUrlRes.signedUrl);
    console.log("\n============================================================");
    console.log("STAGE 10 FRONTEND MEDIA INTEGRATION E2E VERIFICATION — PASSED");
    console.log("============================================================");
}
runStage10Verification().catch((err) => {
    console.error("E2E Stage 10 Verification Failed:", err);
    process.exit(1);
});
