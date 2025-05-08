#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Define the slug mapping
const slugMapping = {
  "/docs/api-reference": "/docs/api-reference",
  "/docs/api-reference/authentication": "/docs/api-reference/authentication",
  "/docs/api-reference/common-error-codes": "/docs/api-reference/common-error-codes",
  "/docs/api-reference/endpoints": "/docs/api-reference/endpoints",
  "/docs/autoscaling": "/docs/billing/autoscaling",
  "/docs/compression/nft-compression": "/docs/nfts/nft-compression",
  "/docs/compression/what-is-zk-compression-on-solana": "/docs/zk-compression/introduction",
  "/docs/credits": "/docs/billing/credits",
  "/docs/das-api": "/docs/api-reference/das",
  "/docs/das-api/getasset": "/docs/api-reference/das/getasset",
  "/docs/das-api/getassetbatch": "/docs/api-reference/das/getassetbatch",
  "/docs/das-api/getassetproof": "/docs/api-reference/das/getassetproof",
  "/docs/das-api/getassetproofbatch": "/docs/api-reference/das/getassetproofbatch",
  "/docs/das-api/getassetsbyauthority": "/docs/api-reference/das/getassetsbyauthority",
  "/docs/das-api/getassetsbycreator": "/docs/api-reference/das/getassetsbycreator",
  "/docs/das-api/getassetsbygroup": "/docs/api-reference/das/getassetsbygroup",
  "/docs/das-api/getassetsbyowner": "/docs/api-reference/das/getassetsbyowner",
  "/docs/das-api/getnfteditions": "/docs/api-reference/das/getnfteditions",
  "/docs/das-api/getsignaturesforasset": "/docs/api-reference/das/getsignaturesforasset",
  "/docs/das-api/gettokenaccounts": "/docs/api-reference/das/gettokenaccounts",
  "/docs/das-api/searchassets": "/docs/api-reference/das/searchassets",
  "/docs/data-streaming": "/docs/data-streaming",
  "/docs/data-streaming/enhanced-websockets": "/docs/enhanced-websockets",
  "/docs/data-streaming/enhanced-websockets/account-subscribe": "/docs/enhanced-websockets/account-subscribe",
  "/docs/data-streaming/enhanced-websockets/transaction-subscribe": "/docs/enhanced-websockets/transaction-subscribe",
  "/docs/data-streaming/laserstream": "/docs/laserstream",
  "/docs/data-streaming/laserstream-enhanced-websocket": "/docs/laserstream/websocket",
  "/docs/data-streaming/laserstream-grpc": "/docs/laserstream/grpc",
  "/docs/data-streaming/quickstart": "/docs/data-streaming/quickstart",
  "/docs/data-streaming/stream-pump-amm-data-with-enhanced-websocket": "/docs/enhanced-websockets/guides/stream-pump-amm-data",
  "/docs/data-streaming/stream-pump-amm-data-with-grpc": "/docs/grpc/guides/stream-pump-amm-data",
  "/docs/data-streaming/stream-pump-amm-data-with-standard-websocket": "/docs/rpc/websocket/guides/stream-pump-amm-data",
  "/docs/data-streaming/websocket": "/docs/rpc/websocket",
  "/docs/data-streaming/yellowstone-grpc-geyser": "/docs/grpc",
  "/docs/data-streaming/yellowstone-grpc-geyser/account-monitoring": "/docs/grpc/account-monitoring",
  "/docs/data-streaming/yellowstone-grpc-geyser/entry-monitoring": "/docs/grpc/entry-monitoring",
  "/docs/data-streaming/yellowstone-grpc-geyser/getting-started-with-yellowstone-grpc-geyser-plugin": "/docs/grpc/quickstart",
  "/docs/data-streaming/yellowstone-grpc-geyser/slot-and-block-monitoring": "/docs/grpc/slot-and-block-monitoring",
  "/docs/data-streaming/yellowstone-grpc-geyser/transaction-monitoring": "/docs/grpc/transaction-monitoring",
  "/docs/enhanced-transactions-api": "/docs/enhanced-transactions",
  "/docs/enhanced-transactions-api/gettransactions": "/docs/api-reference/enhanced-transactions/gettransactions",
  "/docs/enhanced-transactions-api/gettransactionsbyaddress": "/docs/api-reference/enhanced-transactions/gettransactionsbyaddress",
  "/docs/event-listening": "/docs/event-listening",
  "/docs/event-listening/guide-to-listening-for-cnft-events": "/docs/webhooks/guides/cnft-event-listening",
  "/docs/event-listening/quickstart": "/docs/event-listening/quickstart",
  "/docs/event-listening/webhooks": "/docs/webhooks",
  "/docs/event-listening/webhooks/faqs": "/docs/webhooks/faqs",
  "/docs/event-listening/webhooks/transaction-types": "/docs/webhooks/transaction-types",
  "/docs/get-started": "/docs",
  "/docs/getting-data": "/docs/getting-data",
  "/docs/getting-data/accounts": "/docs/rpc/http/guides/get-accounts",
  "/docs/getting-data/das-api": "/docs/das-api",
  "/docs/getting-data/das-api/fungible-token-extension": "/docs/das/fungible-token-extension",
  "/docs/getting-data/das-api/paginating": "/docs/das/pagination",
  "/docs/getting-data/nfts": "/docs/das/guides/get-nfts",
  "/docs/getting-data/program-accounts": "/docs/rpc/http/guides/get-program-accounts",
  "/docs/getting-data/tokens": "/docs/das/guides/get-tokens",
  "/docs/getting-data/transactions": "/docs/rpc/http/guides/get-transactions",
  "/docs/getting-data/enhanced-transactions-api": "/docs/enhanced-transactions",
  "/docs/laserstream-grpc-api": "/docs/api-reference/laserstream/grpc",
  "/docs/laserstream-grpc/getblockheight": "/docs/api-reference/laserstream/grpc/getblockheight",
  "/docs/laserstream-grpc/getlatestblockhash": "/docs/api-reference/laserstream/grpc/getlatestblockhash",
  "/docs/laserstream-grpc/getslot": "/docs/api-reference/laserstream/grpc/getslot",
  "/docs/laserstream-grpc/getversion": "/docs/api-reference/laserstream/grpc/getversion",
  "/docs/laserstream-grpc/isblockhashvalid": "/docs/api-reference/laserstream/grpc/isblockhashvalid",
  "/docs/laserstream-grpc/ping": "/docs/api-reference/laserstream/grpc/ping",
  "/docs/laserstream-grpc/subscribe": "/docs/api-reference/laserstream/grpc/subscribe",
  "/docs/mint-api/mintcompressednft": "/docs/api-reference/mint/mintcompressednft",
  "/docs/pay-with-crypto": "/docs/billing/pay-with-crypto",
  "/docs/plans-and-rate-limits": "/docs/billing/plans-and-rate-limits",
  "/docs/prepaid-credits": "/docs/billing/prepaid-credits",
  "/docs/priority-fee-api/getpriorityfeeestimate": "/docs/api-reference/priority-fee/getpriorityfeeestimate",
  "/docs/quickstart": "/docs/quickstart",
  "/docs/rpc/http-methods": "/docs/api-reference/rpc/http-methods",
  "/docs/rpc/http/getaccountinfo": "/docs/api-reference/rpc/http/getaccountinfo",
  "/docs/rpc/http/getbalance": "/docs/api-reference/rpc/http/getbalance",
  "/docs/rpc/http/getblock": "/docs/api-reference/rpc/http/getblock",
  "/docs/rpc/http/getblockcommitment": "/docs/api-reference/rpc/http/getblockcommitment",
  "/docs/rpc/http/getblockheight": "/docs/api-reference/rpc/http/getblockheight",
  "/docs/rpc/http/getblockproduction": "/docs/api-reference/rpc/http/getblockproduction",
  "/docs/rpc/http/getblocks": "/docs/api-reference/rpc/http/getblocks",
  "/docs/rpc/http/getblockswithlimit": "/docs/api-reference/rpc/http/getblockswithlimit",
  "/docs/rpc/http/getblocktime": "/docs/api-reference/rpc/http/getblocktime",
  "/docs/rpc/http/getclusternodes": "/docs/api-reference/rpc/http/getclusternodes",
  "/docs/rpc/http/getepochinfo": "/docs/api-reference/rpc/http/getepochinfo",
  "/docs/rpc/http/getepochschedule": "/docs/api-reference/rpc/http/getepochschedule",
  "/docs/rpc/http/getfeeformessage": "/docs/api-reference/rpc/http/getfeeformessage",
  "/docs/rpc/http/getfirstavailableblock": "/docs/api-reference/rpc/http/getfirstavailableblock",
  "/docs/rpc/http/getgenesishash": "/docs/api-reference/rpc/http/getgenesishash",
  "/docs/rpc/http/gethealth": "/docs/api-reference/rpc/http/gethealth",
  "/docs/rpc/http/gethighestsnapshotslot": "/docs/api-reference/rpc/http/gethighestsnapshotslot",
  "/docs/rpc/http/getidentity": "/docs/api-reference/rpc/http/getidentity",
  "/docs/rpc/http/getinflationgovernor": "/docs/api-reference/rpc/http/getinflationgovernor",
  "/docs/rpc/http/getinflationrate": "/docs/api-reference/rpc/http/getinflationrate",
  "/docs/rpc/http/getinflationreward": "/docs/api-reference/rpc/http/getinflationreward",
  "/docs/rpc/http/getlargestaccounts": "/docs/api-reference/rpc/http/getlargestaccounts",
  "/docs/rpc/http/getlatestblockhash": "/docs/api-reference/rpc/http/getlatestblockhash",
  "/docs/rpc/http/getleaderschedule": "/docs/api-reference/rpc/http/getleaderschedule",
  "/docs/rpc/http/getmaxretransmitslot": "/docs/api-reference/rpc/http/getmaxretransmitslot",
  "/docs/rpc/http/getmaxshredinsertslot": "/docs/api-reference/rpc/http/getmaxshredinsertslot",
  "/docs/rpc/http/getminimumbalanceforrentexemption": "/docs/api-reference/rpc/http/getminimumbalanceforrentexemption",
  "/docs/rpc/http/getmultipleaccounts": "/docs/api-reference/rpc/http/getmultipleaccounts",
  "/docs/rpc/http/getprogramaccounts": "/docs/api-reference/rpc/http/getprogramaccounts",
  "/docs/rpc/http/getrecentperformancesamples": "/docs/api-reference/rpc/http/getrecentperformancesamples",
  "/docs/rpc/http/getrecentprioritizationfees": "/docs/api-reference/rpc/http/getrecentprioritizationfees",
  "/docs/rpc/http/getsignaturesforaddress": "/docs/api-reference/rpc/http/getsignaturesforaddress",
  "/docs/rpc/http/getsignaturestatuses": "/docs/api-reference/rpc/http/getsignaturestatuses",
  "/docs/rpc/http/getslot": "/docs/api-reference/rpc/http/getslot",
  "/docs/rpc/http/getslotleader": "/docs/api-reference/rpc/http/getslotleader",
  "/docs/rpc/http/getslotleaders": "/docs/api-reference/rpc/http/getslotleaders",
  "/docs/rpc/http/getstakeminimumdelegation": "/docs/api-reference/rpc/http/getstakeminimumdelegation",
  "/docs/rpc/http/getsupply": "/docs/api-reference/rpc/http/getsupply",
  "/docs/rpc/http/gettokenaccountbalance": "/docs/api-reference/rpc/http/gettokenaccountbalance",
  "/docs/rpc/http/gettokenaccountsbydelegate": "/docs/api-reference/rpc/http/gettokenaccountsbydelegate",
  "/docs/rpc/http/gettokenaccountsbyowner": "/docs/api-reference/rpc/http/gettokenaccountsbyowner",
  "/docs/rpc/http/gettokenlargestaccounts": "/docs/api-reference/rpc/http/gettokenlargestaccounts",
  "/docs/rpc/http/gettokensupply": "/docs/api-reference/rpc/http/gettokensupply",
  "/docs/rpc/http/gettransaction": "/docs/api-reference/rpc/http/gettransaction",
  "/docs/rpc/http/gettransactioncount": "/docs/api-reference/rpc/http/gettransactioncount",
  "/docs/rpc/http/getversion": "/docs/api-reference/rpc/http/getversion",
  "/docs/rpc/http/getvoteaccounts": "/docs/api-reference/rpc/http/getvoteaccounts",
  "/docs/rpc/http/isblockhashvalid": "/docs/api-reference/rpc/http/isblockhashvalid",
  "/docs/rpc/http/minimumledgerslot": "/docs/api-reference/rpc/http/minimumledgerslot",
  "/docs/rpc/http/requestairdrop": "/docs/api-reference/rpc/http/requestairdrop",
  "/docs/rpc/http/sendtransaction": "/docs/api-reference/rpc/http/sendtransaction",
  "/docs/rpc/http/simulatetransaction": "/docs/api-reference/rpc/http/simulatetransaction",
  "/docs/rpc/websocket-methods": "/docs/api-reference/rpc/websocket-methods",
  "/docs/rpc/websocket/accountsubscribe": "/docs/api-reference/rpc/websocket/accountsubscribe",
  "/docs/rpc/websocket/accountunsubscribe": "/docs/api-reference/rpc/websocket/accountunsubscribe",
  "/docs/rpc/websocket/blocksubscribe": "/docs/api-reference/rpc/websocket/blocksubscribe",
  "/docs/rpc/websocket/blockunsubscribe": "/docs/api-reference/rpc/websocket/blockunsubscribe",
  "/docs/rpc/websocket/logssubscribe": "/docs/api-reference/rpc/websocket/logssubscribe",
  "/docs/rpc/websocket/logsunsubscribe": "/docs/api-reference/rpc/websocket/logsunsubscribe",
  "/docs/rpc/websocket/programsubscribe": "/docs/api-reference/rpc/websocket/programsubscribe",
  "/docs/rpc/websocket/programunsubscribe": "/docs/api-reference/rpc/websocket/programunsubscribe",
  "/docs/rpc/websocket/rootsubscribe": "/docs/api-reference/rpc/websocket/rootsubscribe",
  "/docs/rpc/websocket/rootunsubscribe": "/docs/api-reference/rpc/websocket/rootunsubscribe",
  "/docs/rpc/websocket/signaturesubscribe": "/docs/api-reference/rpc/websocket/signaturesubscribe",
  "/docs/rpc/websocket/signatureunsubscribe": "/docs/api-reference/rpc/websocket/signatureunsubscribe",
  "/docs/rpc/websocket/slotsubscribe": "/docs/api-reference/rpc/websocket/slotsubscribe",
  "/docs/rpc/websocket/slotsupdatessubscribe": "/docs/api-reference/rpc/websocket/slotsupdatessubscribe",
  "/docs/rpc/websocket/slotsupdatesunsubscribe": "/docs/api-reference/rpc/websocket/slotsupdatesunsubscribe",
  "/docs/rpc/websocket/slotunsubscribe": "/docs/api-reference/rpc/websocket/slotunsubscribe",
  "/docs/rpc/websocket/votesubscribe": "/docs/api-reference/rpc/websocket/votesubscribe",
  "/docs/rpc/websocket/voteunsubscribe": "/docs/api-reference/rpc/websocket/voteunsubscribe",
  "/docs/sdks": "/docs/sdks",
  "/docs/sending-transactions": "/docs/sending-transactions",
  "/docs/sending-transactions/how-to-stake-with-helius-programmatically": "/docs/staking/guides/how-to-stake-with-helius-programmatically",
  "/docs/sending-transactions/priority-fee-api": "/docs/priority-fee-api",
  "/docs/sending-transactions/priority-fees": "/docs/sending-transactions/priority-fees",
  "/docs/sending-transactions/priority-fees/best-practices": "/docs/priority-fee/best-practices",
  "/docs/sending-transactions/priority-fees/estimating-fees-using-account-keys": "/docs/priority-fee/estimating-fees-using-account-keys",
  "/docs/sending-transactions/priority-fees/estimating-fees-using-serialized-transaction": "/docs/priority-fee/estimating-fees-using-serialized-transaction",
  "/docs/sending-transactions/quickstart": "/docs/sending-transactions",
  "/docs/sending-transactions/smart-transactions": "/docs/sending-transactions/smart-transactions",
  "/docs/sending-transactions/staked-connections": "/docs/sending-transactions/staked-connections",
  "/docs/solana-rpc-nodes": "/docs/solana-rpc-nodes",
  "/docs/solana-rpc-nodes/dedicated-nodes": "/docs/dedicated-nodes",
  "/docs/solana-rpc-nodes/dedicated-nodes/best-practices": "/docs/dedicated-nodes/best-practices",
  "/docs/solana-rpc-nodes/dedicated-nodes/dashboard": "/docs/dedicated-nodes/dashboard",
  "/docs/solana-rpc-nodes/dedicated-nodes/getting-started": "/docs/dedicated-nodes/getting-started",
  "/docs/solana-rpc-nodes/dedicated-nodes/order-dedicated-node": "/docs/dedicated-nodes/order-dedicated-node",
  "/docs/solana-rpc-nodes/protect-your-keys": "/docs/rpc/protect-your-keys",
  "/docs/solana-rpc-nodes/quickstart": "/docs/rpc/quickstart",
  "/docs/solana-rpc-nodes/rpc-optimization-techniques": "/docs/rpc/optimization-techniques",
  "/docs/token-metadata/querymetadatav1": "/docs/api-reference/token-metadata/querymetadatav1",
  "/docs/webhooks-api": "/docs/api-reference/webhooks",
  "/docs/webhooks/create-webhook": "/docs/api-reference/webhooks/create-webhook",
  "/docs/webhooks/delete-webhook": "/docs/api-reference/webhooks/delete-webhook",
  "/docs/webhooks/get-all-webhooks": "/docs/api-reference/webhooks/get-all-webhooks",
  "/docs/webhooks/get-webhook": "/docs/api-reference/webhooks/get-webhook",
  "/docs/webhooks/update-webhook": "/docs/api-reference/webhooks/update-webhook",
  "/docs/zk-compression-api": "/docs/api-reference/zk-compression",
  "/docs/zk-compression/getcompressedaccount": "/docs/api-reference/zk-compression/getcompressedaccount",
  "/docs/zk-compression/getcompressedaccountproof": "/docs/api-reference/zk-compression/getcompressedaccountproof",
  "/docs/zk-compression/getcompressedaccountsbyowner": "/docs/api-reference/zk-compression/getcompressedaccountsbyowner",
  "/docs/zk-compression/getcompressedbalance": "/docs/api-reference/zk-compression/getcompressedbalance",
  "/docs/zk-compression/getcompressedbalancebyowner": "/docs/api-reference/zk-compression/getcompressedbalancebyowner",
  "/docs/zk-compression/getcompressedminttokenholders": "/docs/api-reference/zk-compression/getcompressedminttokenholders",
  "/docs/zk-compression/getcompressedtokenaccountbalance": "/docs/api-reference/zk-compression/getcompressedtokenaccountbalance",
  "/docs/zk-compression/getcompressedtokenaccountsbydelegate": "/docs/api-reference/zk-compression/getcompressedtokenaccountsbydelegate",
  "/docs/zk-compression/getcompressedtokenaccountsbyowner": "/docs/api-reference/zk-compression/getcompressedtokenaccountsbyowner",
  "/docs/zk-compression/getcompressedtokenbalancesbyowner": "/docs/api-reference/zk-compression/getcompressedtokenbalancesbyowner",
  "/docs/zk-compression/getcompressedtokenbalancesbyownerv2": "/docs/api-reference/zk-compression/getcompressedtokenbalancesbyownerv2",
  "/docs/zk-compression/getcompressionsignaturesforaccount": "/docs/api-reference/zk-compression/getcompressionsignaturesforaccount",
  "/docs/zk-compression/getcompressionsignaturesforaddress": "/docs/api-reference/zk-compression/getcompressionsignaturesforaddress",
  "/docs/zk-compression/getcompressionsignaturesforowner": "/docs/api-reference/zk-compression/getcompressionsignaturesforowner",
  "/docs/zk-compression/getcompressionsignaturesfortokenowner": "/docs/api-reference/zk-compression/getcompressionsignaturesfortokenowner",
  "/docs/zk-compression/getindexerhealth": "/docs/api-reference/zk-compression/getindexerhealth",
  "/docs/zk-compression/getindexerslot": "/docs/api-reference/zk-compression/getindexerslot",
  "/docs/zk-compression/getlatestcompressionsignatures": "/docs/api-reference/zk-compression/getlatestcompressionsignatures",
  "/docs/zk-compression/getlatestnonvotingsignatures": "/docs/api-reference/zk-compression/getlatestnonvotingsignatures",
  "/docs/zk-compression/getmultiplecompressedaccountproofs": "/docs/api-reference/zk-compression/getmultiplecompressedaccountproofs",
  "/docs/zk-compression/getmultiplecompressedaccounts": "/docs/api-reference/zk-compression/getmultiplecompressedaccounts",
  "/docs/zk-compression/getmultiplenewaddressproofs": "/docs/api-reference/zk-compression/getmultiplenewaddressproofs",
  "/docs/zk-compression/getmultiplenewaddressProofsv2": "/docs/api-reference/zk-compression/getmultiplenewaddressProofsv2",
  "/docs/zk-compression/gettransactionwithcompressioninfo": "/docs/api-reference/zk-compression/gettransactionwithcompressioninfo",
  "/docs/zk-compression/getvalidityproof": "/docs/api-reference/zk-compression/getvalidityproof",
};

// Create mappings without /docs/ prefix for the actual links in files
const simpleSlugMapping = {};
Object.entries(slugMapping).forEach(([oldPath, newPath]) => {
  // Remove the /docs/ prefix from both paths
  const simplifiedOldPath = oldPath.replace(/^\/docs\//, '');
  const simplifiedNewPath = newPath.replace(/^\/docs\//, '');
  
  // Only add if there's an actual change
  if (simplifiedOldPath !== simplifiedNewPath) {
    simpleSlugMapping[simplifiedOldPath] = simplifiedNewPath;
  }
});

// Function to find all MDX files recursively
async function findMdxFiles(directory) {
  const dirents = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(directory, dirent.name);
      if (dirent.isDirectory()) {
        return findMdxFiles(res);
      } else if (res.endsWith('.mdx') || res.endsWith('.md')) {
        return res;
      }
      return null;
    })
  );
  
  return files.flat().filter(Boolean);
}

// Function to update links in a file
async function updateFileLinks(filePath) {
  const content = await readFile(filePath, 'utf8');
  let updatedContent = content;
  let changes = false;

  // Update links in two patterns:
  // 1. href attributes: href="/path/to/page"
  // 2. Regular markdown links: [Link text](/path/to/page)
  
  // Replace href attributes
  const hrefRegex = /href=(["'])\/([^"']+)\1/g;
  updatedContent = updatedContent.replace(hrefRegex, (match, quote, path) => {
    if (simpleSlugMapping[path]) {
      changes = true;
      return `href=${quote}/${simpleSlugMapping[path]}${quote}`;
    }
    return match;
  });

  // Replace markdown links
  const markdownLinkRegex = /\[([^\]]+)\]\(\/([^)]+)\)/g;
  updatedContent = updatedContent.replace(markdownLinkRegex, (match, text, path) => {
    if (simpleSlugMapping[path]) {
      changes = true;
      return `[${text}](/${simpleSlugMapping[path]})`;
    }
    return match;
  });

  if (changes) {
    await writeFile(filePath, updatedContent, 'utf8');
    return filePath;
  }
  
  return null;
}

// Main function
async function main() {
  try {
    const mdxFiles = await findMdxFiles('.');
    console.log(`Found ${mdxFiles.length} MDX files to process`);

    const updatePromises = mdxFiles.map(updateFileLinks);
    const updatedFiles = (await Promise.all(updatePromises)).filter(Boolean);

    console.log(`Updated links in ${updatedFiles.length} files:`);
    updatedFiles.forEach(file => console.log(`- ${file}`));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 