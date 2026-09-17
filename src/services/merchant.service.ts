import { AppError } from "../errors/AppError";
import * as merchantRepository from "../repositories/merchant.repository";
import { Page } from "../types/common.types";
import { Merchant, MerchantStatus } from "../types/merchant.types";

export async function createMerchant(name: string): Promise<Merchant> {
  return merchantRepository.insertMerchant(name);
}

export async function getMerchant(id: number): Promise<Merchant> {
  const merchant = await merchantRepository.findMerchantById(id);
  if (!merchant) {
    throw AppError.notFound("merchant_not_found", `Merchant ${id} not found`, { merchant_id: id });
  }
  return merchant;
}

export async function listMerchants(
  status: MerchantStatus | undefined,
  limit: number,
  offset: number
): Promise<Page<Merchant>> {
  const { items, total } = await merchantRepository.listMerchants(status, { limit, offset });
  return { items, total, limit, offset };
}

export async function setMerchantStatus(id: number, status: MerchantStatus): Promise<Merchant> {
  const merchant = await merchantRepository.updateMerchantStatus(id, status);
  if (!merchant) {
    throw AppError.notFound("merchant_not_found", `Merchant ${id} not found`, { merchant_id: id });
  }
  return merchant;
}
