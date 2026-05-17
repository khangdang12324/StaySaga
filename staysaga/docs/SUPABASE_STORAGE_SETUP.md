# Supabase Storage Setup

Use this checklist to create the two storage buckets needed by StaySaga and verify that hero images and listing images are saved correctly.

## 1) Create the buckets

In your Supabase project:

1. Open **Storage**.
2. Click **New bucket**.
3. Create a bucket named `site-assets`.
4. Turn **Public bucket** ON.
5. Save it.
6. Click **New bucket** again.
7. Create a bucket named `homestay-images`.
8. Turn **Public bucket** ON.
9. Save it.

If you prefer SQL, the repo includes a migration that creates both buckets:

- [supabase/migrations/202605150003_storage_buckets.sql](../supabase/migrations/202605150003_storage_buckets.sql)

## 2) Confirm the admin user can edit site settings

1. Open **Auth** -> **Users**.
2. Find the user you are testing with.
3. Open the `profiles` table.
4. Set `role = 'admin'` for that user ID.

This is required to upload the hero image from `/admin`.

## 3) Upload the hero image

1. Run the app locally.
2. Sign in as the admin user.
3. Go to `/admin`.
4. In **Cấu hình website**, choose a file for **Ảnh chủ đề (Hero image)**.
5. Click **Lưu cấu hình**.

Expected result:

- The file uploads into `site-assets`.
- The public URL is stored in `site_settings` under `hero_image`.
- The storage path is stored in `site_settings` under `hero_image_path`.
- The homepage hero updates after the redirect.

## 4) Upload a listing image

1. Make sure the test user is a host.
2. If needed, open `/host/onboard` and activate host access.
3. Go to `/host`.
4. Create or edit a homestay.
5. Choose a file in **Anh homestay**.
6. Save the form.

Expected result:

- The file uploads into `homestay-images`.
- A row is inserted into `homestay_images` with:
  - `homestay_id`
  - `url`
  - `storage_path`
  - `alt`
- The listing card and homestay detail page show the uploaded image.

## 5) Verify URLs in Storage and tables

### In Storage

1. Open **Storage**.
2. Open `site-assets`.
3. Confirm the hero image file is present.
4. Open `homestay-images`.
5. Confirm the listing image file is present.

### In the tables

1. Open **Table Editor** -> `site_settings`.
2. Confirm there are rows for:
   - `hero_image`
   - `hero_image_path`
3. Open **Table Editor** -> `homestay_images`.
4. Confirm the inserted row contains the uploaded image URL and `storage_path`.

## 6) If something fails

- If the upload returns a storage error, confirm the bucket names exactly match:
  - `site-assets`
  - `homestay-images`
- If the image does not show after upload, confirm both buckets are public.
- If the delete button clears the URL but not the file, make sure `hero_image_path` is present in `site_settings`.

## 7) Quick routes to test

- Homepage: `/`
- Admin settings: `/admin`
- Host landing page: `/host/list`
- Host onboarding: `/host/onboard`
- Host dashboard: `/host`
- Homestay detail: `/homestays/[slug]`
