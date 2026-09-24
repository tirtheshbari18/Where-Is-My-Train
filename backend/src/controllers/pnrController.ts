import { Request, Response, NextFunction } from 'express';
import { railwayService } from '../services/railwayService.js';

export class PnrController {
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const pnr = req.params.pnr as string;

      if (!pnr || !/^\d{10}$/.test(pnr)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'PNR must be a valid 10-digit numeric Indian Railways reservation number.',
            code: 'INVALID_PNR_FORMAT',
          },
        });
      }

      const pnrData = await railwayService.getPnrStatus(pnr);

      res.json({
        success: true,
        data: pnrData,
        officialPortalUrl: 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html',
        complianceNotice:
          'PNR tracking must strictly adhere to Indian Railways / CRIS data access policies. Live production checks require authorized IRCTC/CRIS partner credentials.',
      });
    } catch (err) {
      next(err);
    }
  }
}
