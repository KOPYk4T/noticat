import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'cargo' | 'abono';
}

export interface ParseExcelResult {
  transactions: ParsedTransaction[];
  success: boolean;
  error?: string;
}

export async function parseBankStatementExcel(file: File): Promise<ParseExcelResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    const transactions: ParsedTransaction[] = [];
    const normalizeKey = (key: string) => key.trim().toLowerCase();
    
    for (const row of data) {
      const rowObj = row as Record<string, any>;
      const keys = Object.keys(rowObj);
      
      const normalizedRow: Record<string, any> = {};
      keys.forEach(key => {
        normalizedRow[normalizeKey(key)] = rowObj[key];
      });
      
      const fecha = normalizedRow['fecha'] || normalizedRow['date'];
      const descripcion = normalizedRow['descripcion'] || normalizedRow['descripción'] || normalizedRow['description'];
      const cargo = normalizedRow['cargo'];
      const abono = normalizedRow['abono'];
      
      if (!fecha || !descripcion) {
        continue;
      }
      
      const cargoStr = String(cargo || '').trim().replace(/[^0-9.]/g, '');
      const abonoStr = String(abono || '').trim().replace(/[^0-9.]/g, '');
      
      const cargoNum = cargoStr ? parseFloat(cargoStr.replace(/\./g, '').replace(',', '.')) : 0;
      const abonoNum = abonoStr ? parseFloat(abonoStr.replace(/\./g, '').replace(',', '.')) : 0;
      
      let amount: number;
      let type: 'cargo' | 'abono';
      
      if (cargoNum > 0) {
        amount = cargoNum;
        type = 'cargo';
      } else if (abonoNum > 0) {
        amount = abonoNum;
        type = 'abono';
      } else {
        continue;
      }
      
      const cleanDescription = String(descripcion)
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
      
      const normalizedDate = normalizeDate(String(fecha));
      
      transactions.push({
        date: normalizedDate,
        description: cleanDescription,
        amount,
        type,
      });
    }
    
    if (transactions.length === 0) {
      return {
        transactions: [],
        success: false,
        error: 'No se encontraron transacciones válidas en el archivo Excel. Verifica el formato.',
      };
    }
    
    return {
      transactions,
      success: true,
    };
  } catch (error) {
    return {
      transactions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar el archivo Excel',
    };
  }
}

function normalizeDate(dateStr: string): string {
  if (dateStr.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
    return dateStr.replace(/-/g, '/');
  }
  
  if (dateStr.match(/^\d{2}[-/]\d{2}[-/]\d{2}$/)) {
    const parts = dateStr.split(/[-/]/);
    const year = parseInt(parts[2], 10);
    const fullYear = year < 50 ? `20${year.toString().padStart(2, '0')}` : `19${year.toString().padStart(2, '0')}`;
    return `${parts[0]}/${parts[1]}/${fullYear}`;
  }
  
  const excelDateNum = parseFloat(dateStr);
  if (!isNaN(excelDateNum) && excelDateNum > 1 && excelDateNum < 1000000) {
    const excelEpoch = new Date(1900, 0, 1);
    const days = excelDateNum - 2;
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
  }
  
  return dateStr;
}

