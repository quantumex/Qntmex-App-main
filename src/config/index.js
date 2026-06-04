// QNTMEX Wallet Configuration
// All keys preserved from V6 HTML wallet

export const CFG = {
  ALCHEMY_KEY:   'a6WprMu3VlO_zzyPEztKm',
  ETH_RPC:       'https://eth-mainnet.g.alchemy.com/v2/a6WprMu3VlO_zzyPEztKm',
  BSC_RPC:       'https://bnb-mainnet.g.alchemy.com/v2/a6WprMu3VlO_zzyPEztKm',
  BSC_FALLBACKS: ['https://rpc.ankr.com/bsc', 'https://bsc.publicnode.com', 'https://bsc-rpc.publicnode.com'],
  SOL_RPC:       'https://mainnet.helius-rpc.com/?api-key=3463486c-79f7-4847-a71b-0c4ced29cb90',
  HELIUS_KEY:    '3463486c-79f7-4847-a71b-0c4ced29cb90',
  TRX_RPC:       'https://api.trongrid.io',
  TRX_API_KEY:   '8397568d-b5d1-480d-88c4-6fe8124d5843',
  CG_KEY:        'CG-KexxmAocCLCusB4aG3m4n513',
  CN_KEY:        'c097754c8c8ab0097462943576e8083704f4c82e689ab0aa4b520ba727e08821',
  SUPABASE_URL:  'https://gylwqpgnggqtlrfyuuwr.supabase.co',
  SUPABASE_ANON: 'sb_publishable_snmsBU_C7Z1Evpac3W6FZg_3S9MJ1he',
  TREASURY: {
    ETH: '0x891D56bCb7E4D855Fd3bb783B93350F411bd0976',
    BSC: '0x891D56bCb7E4D855Fd3bb783B93350F411bd0976',
    BTC: 'bc1qw9dd67zqusnkqv0884ueekz5nraw60ht2e9t40',
    SOL: 'GUT97P12YUCgVxnDfS6JQNdz62GGADrBZeZEGsqJJr2M',
    TRX: 'TMXWX7LCHhG54xCwJcSfcVVe1CWWiBzH3g',
  },
};

export const STORAGE_KEY = 'qntmex_wallet_v4';
export const SWAP_FEE_PCT = 0.003; // 0.3%

export const CHAINS = {
  ETH: { n: 'Ethereum',  sym: 'ETH', ico: 'Ξ',   pip: '#627EEA', col: '#627EEA', cgId: 'ethereum',     explorer: 'https://etherscan.io' },
  BTC: { n: 'Bitcoin',   sym: 'BTC', ico: '₿',   pip: '#F7931A', col: '#F7931A', cgId: 'bitcoin',      explorer: 'https://mempool.space' },
  SOL: { n: 'Solana',    sym: 'SOL', ico: '◎',   pip: '#9945FF', col: '#9945FF', cgId: 'solana',       explorer: 'https://solscan.io' },
  BSC: { n: 'BNB Chain', sym: 'BNB', ico: 'BNB', pip: '#F3BA2F', col: '#F3BA2F', cgId: 'binancecoin',  explorer: 'https://bscscan.com' },
  TRX: { n: 'Tron',      sym: 'TRX', ico: 'TRX', pip: '#EB0029', col: '#EB0029', cgId: 'tron',         explorer: 'https://tronscan.org' },
};

export const COLORS = {
  void:     '#040302',
  bg:       '#060604',
  bg1:      '#080705',
  bg2:      '#0C0A05',
  surface:  '#111008',
  surface2: '#161309',
  lift:     '#1C190C',
  border:   '#231F0F',
  border2:  '#2E2914',
  rim:      '#3A3418',
  dim:      '#5A5238',
  muted:    '#7A7058',
  text3:    '#9A9070',
  text2:    '#C8BFA8',
  text:     '#EDE4CC',
  bright:   '#F8F0DC',
  gold:     '#C9A84C',
  gold2:    '#DDB85C',
  gold3:    '#EECC70',
  gold4:    '#F5DC90',
  goldDim:  '#9A7830',
  goldG1:   'rgba(201,168,76,0.06)',
  goldG2:   'rgba(201,168,76,0.12)',
  goldG3:   'rgba(201,168,76,0.22)',
  goldG4:   'rgba(201,168,76,0.40)',
  goldRim:  'rgba(201,168,76,0.18)',
  goldGlow: 'rgba(201,168,76,0.20)',
  green:    '#22C884',
  green2:   'rgba(34,200,132,0.14)',
  red:      '#E05C5C',
  red2:     'rgba(224,92,92,0.14)',
  eth:      '#627EEA',
  btc:      '#F7931A',
  sol:      '#9945FF',
  bnb:      '#F3BA2F',
  trx:      '#EB0029',
};

export const SWAP_TOKENS = [
  { key:'ETH',      sym:'ETH',  name:'Ethereum',    chainKey:'ETH', cnCur:'eth',  cnNet:'eth',  logo:'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',         color:'#627EEA' },
  { key:'BTC',      sym:'BTC',  name:'Bitcoin',     chainKey:'BTC', cnCur:'btc',  cnNet:'btc',  logo:'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',            color:'#F7931A' },
  { key:'SOL',      sym:'SOL',  name:'Solana',      chainKey:'SOL', cnCur:'sol',  cnNet:'sol',  logo:'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',          color:'#9945FF' },
  { key:'BNB',      sym:'BNB',  name:'BNB Chain',   chainKey:'BSC', cnCur:'bnb',  cnNet:'bsc',  logo:'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',    color:'#F3BA2F' },
  { key:'TRX',      sym:'TRX',  name:'Tron',        chainKey:'TRX', cnCur:'trx',  cnNet:'trx',  logo:'https://coin-images.coingecko.com/coins/images/1094/small/tron-logo.png',      color:'#EB0029' },
  { key:'USDC_ETH', sym:'USDC', name:'USDC (ETH)',  chainKey:'ETH', cnCur:'usdc', cnNet:'eth',  logo:'https://coin-images.coingecko.com/coins/images/6319/small/usdc.png',           color:'#2775CA' },
  { key:'USDC_SOL', sym:'USDC', name:'USDC (SOL)',  chainKey:'SOL', cnCur:'usdc', cnNet:'sol',  logo:'https://coin-images.coingecko.com/coins/images/6319/small/usdc.png',           color:'#2775CA' },
  { key:'USDC_BSC', sym:'USDC', name:'USDC (BSC)',  chainKey:'BSC', cnCur:'usdc', cnNet:'bsc',  logo:'https://coin-images.coingecko.com/coins/images/6319/small/usdc.png',           color:'#2775CA' },
  { key:'USDT_ETH', sym:'USDT', name:'USDT (ETH)',  chainKey:'ETH', cnCur:'usdt', cnNet:'eth',  logo:'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',          color:'#26A17B' },
  { key:'USDT_SOL', sym:'USDT', name:'USDT (SOL)',  chainKey:'SOL', cnCur:'usdt', cnNet:'sol',  logo:'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',          color:'#26A17B' },
  { key:'USDT_BSC', sym:'USDT', name:'USDT (BSC)',  chainKey:'BSC', cnCur:'usdt', cnNet:'bsc',  logo:'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',          color:'#26A17B' },
  { key:'USDT_TRX', sym:'USDT', name:'USDT (TRX)',  chainKey:'TRX', cnCur:'usdt', cnNet:'trx',  logo:'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',          color:'#26A17B' },
];
