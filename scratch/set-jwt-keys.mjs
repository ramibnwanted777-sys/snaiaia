import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const DEPLOYMENT_URL = "https://dutiful-chipmunk-373.eu-west-1.convex.cloud";
const ADMIN_KEY = "eyJ2MiI6ImEwNjc3NTM1N2ZjZjQyNDI5ZjBiYzJkZTM5NDE4MDUwIn0=";

console.log("Generating RS256 key pair...");
const keys = await generateKeyPair("RS256");
const privateKey = await exportPKCS8(keys.privateKey);
const publicKeyJwk = await exportJWK(keys.publicKey);

// Store private key with spaces instead of newlines (Convex env var friendly)
const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");

// Build JWKS
const jwks = JSON.stringify({
  keys: [{ use: "sig", ...publicKeyJwk }],
});

console.log("JWT_PRIVATE_KEY (first 60 chars):", jwtPrivateKey.slice(0, 60));
console.log("JWKS:", jwks.slice(0, 80));

console.log("\nUploading to Convex...");
const res = await fetch(`${DEPLOYMENT_URL}/api/update_environment_variables`, {
  method: "POST",
  headers: {
    Authorization: `Convex ${ADMIN_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    changes: [
      { name: "JWT_PRIVATE_KEY", value: jwtPrivateKey },
      { name: "JWKS", value: jwks },
    ],
  }),
});

const text = await res.text();
console.log("Status:", res.status);
console.log("Response:", text);

if (res.ok) {
  console.log("\n✅ JWT_PRIVATE_KEY and JWKS set successfully!");
} else {
  console.error("\n❌ Failed to set keys. See response above.");
}
