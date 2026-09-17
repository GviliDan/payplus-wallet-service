import { Response } from "express";
import * as walletService from "../services/wallet.service";
import { ValidatedRequest } from "../middleware/validateRequest";
import {
  CreateWalletBody,
  ListWalletsQuery,
  UpdateWalletStatusBody,
  WalletIdParams,
} from "../schemas/wallet.schema";

export async function create(req: ValidatedRequest<CreateWalletBody>, res: Response) {
  const body = req.validated.body;
  const wallet = await walletService.createWallet(body.owner_identity, body.currency, body.initial_balance);
  res.status(201).json(wallet);
}

export async function getById(req: ValidatedRequest<unknown, WalletIdParams>, res: Response) {
  const params = req.validated.params;
  const wallet = await walletService.getWallet(params.id);
  res.json(wallet);
}

export async function list(req: ValidatedRequest<unknown, unknown, ListWalletsQuery>, res: Response) {
  const query = req.validated.query;
  const page = await walletService.listWallets(query.status, query.currency, query.limit, query.offset);
  res.json(page);
}

export async function updateStatus(
  req: ValidatedRequest<UpdateWalletStatusBody, WalletIdParams>,
  res: Response
) {
  const params = req.validated.params;
  const body = req.validated.body;
  const wallet = await walletService.setWalletStatus(params.id, body.status);
  res.json(wallet);
}
