const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://pokso-ux.github.io/pokso-cyberpunk';
const TOTAL_TOKENS = 500;

// Generate metadata for each token
for (let i = 0; i < TOTAL_TOKENS; i++) {
  const metadata = {
    LSP4Metadata: {
      name: `POKSO Cyberpunk #${i}`,
      description: `A unique cyberpunk digital identity. POKSO #${i} of 500.`,
      links: [
        {
          title: "Collection",
          url: "https://pokso-ux.github.io/pokso-cyberpunk/"
        }
      ],
      icon: [
        {
          width: 256,
          height: 256,
          url: `${BASE_URL}/nfts/icon.png`,
          verification: {
            method: "keccak256(bytes)",
            data: "0x"
          }
        }
      ],
      images: [
        {
          width: 512,
          height: 512,
          url: `${BASE_URL}/${i}.png`,
          verification: {
            method: "keccak256(bytes)",
            data: "0x"
          }
        }
      ],
      assets: [],
      attributes: [
        {
          key: "Token ID",
          value: i.toString(),
          type: "string"
        },
        {
          key: "Collection Size",
          value: "500",
          type: "number"
        }
      ]
    }
  };

  const outputPath = path.join(__dirname, 'nfts', 'metadata', `${i}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
}

console.log(`✅ Generated ${TOTAL_TOKENS} metadata files in nfts/metadata/`);
console.log(`Example: ${BASE_URL}/nfts/metadata/0.json`);
console.log(`Image: ${BASE_URL}/0.png`);