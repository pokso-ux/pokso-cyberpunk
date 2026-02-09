const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load private key
const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json', 'utf8'));
let privateKey = keyData.privateKey;
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

// LUKSO Mainnet
const LUKSO_RPC = 'https://42.rpc.thirdweb.com';
const provider = new ethers.providers.JsonRpcProvider(LUKSO_RPC);
const wallet = new ethers.Wallet(privateKey, provider);

// LSP8 Contract Bytecode et ABI (simplifié)
const LSP8_BYTECODE = "0x"; // À remplacer par le vrai bytecode

// Configuration
const COLLECTION_NAME = "POKSO Cyberpunk OFFICIAL";
const COLLECTION_SYMBOL = "POKSO";
const BASE_URI = "https://pokso-ux.github.io/pokso-cyberpunk/official/metadata/";
const MAX_SUPPLY = 500;
const MAX_PER_WALLET = 10;

console.log('========================================');
console.log('POKSO OFFICIAL Collection Deployment');
console.log('========================================');
console.log('Name:', COLLECTION_NAME);
console.log('Symbol:', COLLECTION_SYMBOL);
console.log('Max Supply:', MAX_SUPPLY);
console.log('Mint Price: 0 LYX (FREE)');
console.log('Wallet:', wallet.address);
console.log('========================================\n');

// Créer les métadonnées de collection
const collectionMetadata = {
  LSP4Metadata: {
    name: COLLECTION_NAME,
    description: "The official POKSO Cyberpunk NFT collection on LUKSO. 500 unique digital identities.",
    links: [
      {
        title: "Website",
        url: "https://pokso-ux.github.io/pokso-cyberpunk/"
      },
      {
        title: "GitHub",
        url: "https://github.com/pokso-ux/pokso-cyberpunk"
      }
    ],
    icon: [
      {
        width: 256,
        height: 256,
        url: "https://pokso-ux.github.io/pokso-cyberpunk/official/icon.png",
        verification: {
          method: "keccak256(bytes)",
          data: "0x"
        }
      }
    ],
    images: [
      [
        {
          width: 1024,
          height: 1024,
          url: "https://pokso-ux.github.io/pokso-cyberpunk/official/banner.png",
          verification: {
            method: "keccak256(bytes)",
            data: "0x"
          }
        }
      ]
    ],
    assets: [],
    attributes: [
      {
        key: "Collection Size",
        value: "500",
        type: "number"
      },
      {
        key: "Mint Price",
        value: "0 LYX",
        type: "string"
      },
      {
        key: "Max Per Wallet",
        value: "10",
        type: "number"
      }
    ]
  }
};

// Sauvegarder les métadonnées
fs.writeFileSync('/root/.openclaw/workspace/pokso-mint-site/official/collection-metadata.json', JSON.stringify(collectionMetadata, null, 2));

console.log('✅ Collection metadata created');
console.log('Location: official/collection-metadata.json');
console.log('');

// Créer le dossier pour les métadonnées de tokens
const metadataDir = '/root/.openclaw/workspace/pokso-mint-site/official/metadata';
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

// Générer les métadonnées pour chaque token
for (let i = 0; i < MAX_SUPPLY; i++) {
  const tokenMetadata = {
    LSP4Metadata: {
      name: `POKSO OFFICIAL #${i}`,
      description: `A unique cyberpunk digital identity. POKSO OFFICIAL #${i} of ${MAX_SUPPLY}.`,
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
          url: "https://pokso-ux.github.io/pokso-cyberpunk/official/icon.png",
          verification: {
            method: "keccak256(bytes)",
            data: "0x"
          }
        }
      ],
      images: [
        [
          {
            width: 512,
            height: 512,
            url: `https://pokso-ux.github.io/pokso-cyberpunk/${i}.png`,
            verification: {
              method: "keccak256(bytes)",
              data: "0x"
            }
          }
        ]
      ],
      assets: [],
      attributes: [
        {
          key: "Token ID",
          value: i.toString(),
          type: "string"
        },
        {
          key: "Collection",
          value: COLLECTION_NAME,
          type: "string"
        },
        {
          key: "Rarity",
          value: "Unique",
          type: "string"
        }
      ]
    }
  };

  fs.writeFileSync(path.join(metadataDir, i.toString()), JSON.stringify(tokenMetadata));
}

console.log(`✅ ${MAX_SUPPLY} token metadata files created`);
console.log('Location: official/metadata/');
console.log('');

console.log('========================================');
console.log('NEXT STEPS:');
console.log('========================================');
console.log('1. Add banner.png and icon.png to official/ folder');
console.log('2. Deploy LSP8 contract with these settings');
console.log('3. Deploy Minter contract (0 LYX price)');
console.log('4. Push to GitHub Pages');
console.log('5. Update website to point to new contracts');
console.log('========================================');