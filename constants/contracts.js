import { Contract } from 'ethers';
import { loadJSONFile } from '../lib/common/utils.js';
import { V1_CONTRACT_ADDRESS, V2_CONTRACT_ADDRESS } from './constants.js';
import provider from './provider.js';

const CONTRACT_V1_ABI = loadJSONFile('./abis/v1.json');
const CONTRACT_V2_ABI = loadJSONFile('./abis/v2.json');

// v1 contract doesn't exist on Goerli staging
export const v1Contract = V1_CONTRACT_ADDRESS
  ? new Contract(V1_CONTRACT_ADDRESS, CONTRACT_V1_ABI, provider)
  : null;

export const v2Contract = new Contract(
  V2_CONTRACT_ADDRESS,
  CONTRACT_V2_ABI,
  provider
);
