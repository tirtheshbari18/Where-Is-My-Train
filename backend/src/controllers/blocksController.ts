import { Request, Response } from 'express';
import { MOCK_POWER_BLOCKS } from '../providers/mock/mockBlocksData.js';

export class BlocksController {
  static getAll(req: Request, res: Response) {
    const { line } = req.query as { line?: string };
    let blocks = [...MOCK_POWER_BLOCKS];

    if (line && line !== 'All') {
      blocks = blocks.filter((b) => b.line.toLowerCase() === line.toLowerCase() || b.line === 'All');
    }

    res.json({
      success: true,
      data: blocks,
      lastUpdated: new Date().toISOString(),
      source: 'Western & Central Railways Joint Traffic Bulletin',
    });
  }
}
