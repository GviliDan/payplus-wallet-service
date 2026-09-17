import { Response } from "express";
import * as merchantService from "../services/merchant.service";
import { ValidatedRequest } from "../middleware/validateRequest";
import {
  CreateMerchantBody,
  ListMerchantsQuery,
  MerchantIdParams,
  UpdateMerchantStatusBody,
} from "../schemas/merchant.schema";

export async function create(req: ValidatedRequest<CreateMerchantBody>, res: Response) {
  const body = req.validated.body;
  const merchant = await merchantService.createMerchant(body.name);
  res.status(201).json(merchant);
}

export async function getById(req: ValidatedRequest<unknown, MerchantIdParams>, res: Response) {
  const params = req.validated.params;
  const merchant = await merchantService.getMerchant(params.id);
  res.json(merchant);
}

export async function list(req: ValidatedRequest<unknown, unknown, ListMerchantsQuery>, res: Response) {
  const query = req.validated.query;
  const page = await merchantService.listMerchants(query.status, query.limit, query.offset);
  res.json(page);
}

export async function updateStatus(
  req: ValidatedRequest<UpdateMerchantStatusBody, MerchantIdParams>,
  res: Response
) {
  const params = req.validated.params;
  const body = req.validated.body;
  const merchant = await merchantService.setMerchantStatus(params.id, body.status);
  res.json(merchant);
}
