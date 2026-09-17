import * as walletRepository from "../repositories/wallet.repository";
import { AppError } from "../errors/AppError";
import { Page } from "../types/common.types";
import { Wallet, WalletStatus } from "../types/wallet.types";

type WalletView = Wallet & { available_balance: string };

function toView(wallet: Wallet): WalletView {
  return { ...wallet, available_balance: wallet.balance };
}

export async function createWallet(
  ownerIdentity: string,
  currency: string,
  initialBalance: string | undefined
): Promise<WalletView> {
  const wallet = await walletRepository.insertWallet(ownerIdentity, currency, initialBalance ?? "0");
  return toView(wallet);
}

export async function getWallet(id: number): Promise<WalletView> {
  const wallet = await walletRepository.findWalletById(id);
  if (!wallet) {
    throw AppError.notFound("wallet_not_found", `Wallet ${id} not found`, { wallet_id: id });
  }
  return toView(wallet);
}

export async function listWallets(
  status: WalletStatus | undefined,
  currency: string | undefined,
  limit: number,
  offset: number
): Promise<Page<WalletView>> {
  const { items, total } = await walletRepository.listWallets(status, currency, { limit, offset });
  return { items: items.map(toView), total, limit, offset };
}

export async function setWalletStatus(id: number, status: WalletStatus): Promise<WalletView> {
  const wallet = await walletRepository.updateWalletStatus(id, status);
  if (!wallet) {
    throw AppError.notFound("wallet_not_found", `Wallet ${id} not found`, { wallet_id: id });
  }
  return toView(wallet);
}
