import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { execSync } from "child_process";

async function run() {
  console.log("Generating RS256 key pair...");
  const keys = await generateKeyPair("RS256");
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });
  const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");

  console.log("Setting JWT_PRIVATE_KEY on Convex...");
  execSync(`npx convex env set JWT_PRIVATE_KEY "${jwtPrivateKey}"`, {
    stdio: "inherit",
    env: {
      ...process.env,
      CONVEX_DEPLOY_KEY: "dev:dutiful-chipmunk-373|eyJ2MiI6ImEwNjc3NTM1N2ZjZjQyNDI5ZjBiYzJkZTM5NDE4MDUwIn0=",
    },
  });

  console.log("Setting JWKS on Convex...");
  // Escape quotes for command line
  const escapedJwks = jwks.replace(/"/g, '\\"');
  execSync(`npx convex env set JWKS "${escapedJwks}"`, {
    stdio: "inherit",
    env: {
      ...process.env,
      CONVEX_DEPLOY_KEY: "dev:dutiful-chipmunk-373|eyJ2MiI6ImEwNjc3NTM1N2ZjZjQyNDI5ZjBiYzJkZTM5NDE4MDUwIn0=",
    },
  });

  console.log("Successfully set JWT_PRIVATE_KEY and JWKS!");
}

run().catch(console.error);

