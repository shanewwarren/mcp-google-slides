/**
 * create_table tool implementation
 *
 * Creates a table on a slide with optional data population.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';
import { inchesToEmu } from '../../utils/emu.js';
import type { Position } from '../../types/common.js';

/**
 * Input schema for create_table tool
 */
export const CreateTableInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The slide to add the table to'),
  rows: z.number().int().min(1).max(25).describe('Number of rows (1-25)'),
  columns: z
    .number()
    .int()
    .min(1)
    .max(20)
    .describe('Number of columns (1-20)'),
  position: z
    .object({
      x: z.number().describe('Left edge in inches'),
      y: z.number().describe('Top edge in inches'),
      width: z.number().describe('Width in inches'),
      height: z.number().describe('Height in inches'),
    })
    .describe('Position and size for the table'),
  data: z
    .array(z.array(z.string()))
    .optional()
    .describe('Table data as 2D array of strings (row-major order)'),
});

export type CreateTableInput = z.infer<typeof CreateTableInputSchema>;

/**
 * Output interface for create_table tool
 */
export interface CreateTableOutput {
  tableId: string;
}

/**
 * Generate a valid object ID for Google Slides API
 *
 * Object IDs must be 5-50 characters and start with alphanumeric or underscore.
 *
 * @returns A unique object ID
 */
function generateObjectId(): string {
  // Use timestamp and random string to ensure uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `table_${timestamp}_${random}`;
}

/**
 * Create a table on a slide
 *
 * @param input - Tool input containing presentation ID, slide ID, rows, columns, position, and optional data
 * @returns Table ID
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function createTable(
  input: CreateTableInput
): Promise<CreateTableOutput> {
  // Validate input
  const validatedInput = CreateTableInputSchema.parse(input);

  // Validate data dimensions if provided
  if (validatedInput.data) {
    if (validatedInput.data.length > validatedInput.rows) {
      throw new Error(
        `Data has ${validatedInput.data.length} rows but table has ${validatedInput.rows} rows`
      );
    }

    for (let i = 0; i < validatedInput.data.length; i++) {
      const row = validatedInput.data[i];
      if (row && row.length > validatedInput.columns) {
        throw new Error(
          `Data row ${i} has ${row.length} columns but table has ${validatedInput.columns} columns`
        );
      }
    }
  }

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Generate unique object ID for the table
  const tableId = generateObjectId();
  const position: Position = validatedInput.position;

  // Convert position from inches to EMU
  const sizeEmu = {
    width: { magnitude: inchesToEmu(position.width), unit: 'EMU' },
    height: { magnitude: inchesToEmu(position.height), unit: 'EMU' },
  };

  const transformEmu = {
    scaleX: 1,
    scaleY: 1,
    translateX: inchesToEmu(position.x),
    translateY: inchesToEmu(position.y),
    unit: 'EMU',
  };

  // Build the CreateTableRequest
  const createTableRequest: any = {
    createTable: {
      objectId: tableId,
      rows: validatedInput.rows,
      columns: validatedInput.columns,
      elementProperties: {
        pageObjectId: validatedInput.slideId,
        size: sizeEmu,
        transform: transformEmu,
      },
    },
  };

  // Collect all requests to batch
  const requests: any[] = [createTableRequest];

  // Add InsertTextRequest for each cell with data
  if (validatedInput.data) {
    for (let rowIndex = 0; rowIndex < validatedInput.data.length; rowIndex++) {
      const row = validatedInput.data[rowIndex];
      if (!row) continue; // Skip undefined rows

      for (
        let colIndex = 0;
        colIndex < row.length && colIndex < validatedInput.columns;
        colIndex++
      ) {
        const cellText = row[colIndex];
        if (cellText) {
          // Skip empty strings
          const insertTextRequest = {
            insertText: {
              objectId: tableId,
              cellLocation: {
                rowIndex,
                columnIndex: colIndex,
              },
              text: cellText,
              insertionIndex: 0,
            },
          };

          requests.push(insertTextRequest);
        }
      }
    }
  }

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the table ID
  return {
    tableId,
  };
}
