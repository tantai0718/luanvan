const fs = require("fs/promises");
const path = require("path");
const uploadRoot = path.join(__dirname, "..", "..", "upload");

const apiBaseUrl = () => {
  const configured = process.env.API_PUBLIC_URL || process.env.SERVER_URL;
  if (configured) return configured.replace(/\/$/, "");
  return `http://localhost:${process.env.PORT || 5000}`;
};

const saveDataUrlImage = async (
  value,
  folder = "products",
  prefix = "product",
) => {
  const match =
    /^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/=\r\n]+)$/.exec(
      value || "",
    );
  if (!match) return value;

  const ext = match[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  const uploadDir = path.join(uploadRoot, folder);
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `${apiBaseUrl()}/upload/${folder}/${fileName}`;
};

const normalizeStoredProductImages = async (values) => {
  const images = Array.isArray(values) ? values.filter(Boolean) : [];
  const stored = [];
  for (const image of images) {
    stored.push(await saveDataUrlImage(image));
  }
  return stored;
};

const normalizeImagePath = (value) => {
  if (!value) return null;
  if (
    value.startsWith("data:image/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  )
    return value;
  return null;
};

const imagesFromGroup = (value) =>
  value ? value.split("||").map(normalizeImagePath).filter(Boolean) : [];

module.exports = {
  saveDataUrlImage,
  normalizeStoredProductImages,
  imagesFromGroup,
  normalizeImagePath,
};
