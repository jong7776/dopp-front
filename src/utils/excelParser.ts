import * as XLSX from 'xlsx'
import { Transaction } from '../types'

interface ExcelRow {
  날짜?: string | number | Date
  설명?: string
  계정과목?: string
  수입?: number | string
  지출?: number | string
  [key: string]: any
}

/**
 * 엑셀 파일을 읽어서 Transaction 배열로 변환
 * @param file 엑셀 파일
 * @returns Transaction 배열
 */
export const parseExcelFile = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('파일을 읽을 수 없습니다.'))
          return
        }

        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // 엑셀 데이터를 JSON으로 변환
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: true, // 날짜를 숫자로 유지 (엑셀 날짜 형식)
          dateNF: 'yyyy-mm-dd', // 날짜 형식 지정
        })

        if (jsonData.length === 0) {
          reject(new Error('엑셀 파일에 데이터가 없습니다.'))
          return
        }

        // JSON 데이터를 Transaction 배열로 변환
        const transactions: Transaction[] = jsonData
          .map((row, index) => {
            try {
              // 날짜 파싱
              let date: Date
              if (row.날짜) {
                if (typeof row.날짜 === 'string') {
                  // 문자열 날짜 파싱 (YYYY-MM-DD, YYYY/MM/DD 등)
                  const dateStr = row.날짜.replace(/\s/g, '')
                  date = new Date(dateStr)
                  if (isNaN(date.getTime())) {
                    throw new Error(`날짜 형식이 올바르지 않습니다: ${row.날짜}`)
                  }
                } else if (typeof row.날짜 === 'number') {
                  // 엑셀 날짜 숫자 형식 (1900년 1월 1일부터의 일수)
                  // 엑셀 날짜는 1900-01-01을 기준으로 한 일수이지만,
                  // 실제로는 1900-01-00을 기준으로 하므로 1을 빼야 함
                  // 하지만 XLSX 라이브러리가 이미 변환해줄 수 있으므로 직접 변환
                  const excelEpoch = new Date(1899, 11, 30) // 1899-12-30
                  date = new Date(excelEpoch.getTime() + row.날짜 * 86400000)
                  if (isNaN(date.getTime())) {
                    throw new Error(`날짜 형식이 올바르지 않습니다: ${row.날짜}`)
                  }
                } else if (row.날짜 instanceof Date) {
                  date = row.날짜
                } else {
                  date = new Date(row.날짜)
                  if (isNaN(date.getTime())) {
                    throw new Error(`날짜 형식이 올바르지 않습니다: ${row.날짜}`)
                  }
                }
              } else {
                throw new Error('날짜가 없습니다.')
              }

              // 금액 파싱
              const income = parseAmount(row.수입)
              const expense = parseAmount(row.지출)

              // 수입과 지출 중 하나만 있어야 함
              if (income > 0 && expense > 0) {
                throw new Error('수입과 지출이 동시에 있습니다.')
              }
              if (income === 0 && expense === 0) {
                throw new Error('수입 또는 지출이 없습니다.')
              }

              const amount = income > 0 ? income : expense
              const type: 'income' | 'expense' = income > 0 ? 'income' : 'expense'

              const transaction: Transaction = {
                id: `excel-${Date.now()}-${index}`,
                date,
                description: row.설명 || '',
                accountId: row.계정과목 || '',
                amount,
                type,
                createdAt: new Date(),
                updatedAt: new Date(),
              }

              return transaction
            } catch (error) {
              console.warn(`행 ${index + 2} 파싱 실패:`, error)
              return null
            }
          })
          .filter((t): t is Transaction => t !== null)

        if (transactions.length === 0) {
          reject(new Error('유효한 거래내역을 찾을 수 없습니다.'))
          return
        }

        resolve(transactions)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * 금액 문자열을 숫자로 변환
 */
const parseAmount = (value: number | string | undefined): number => {
  if (value === undefined || value === null || value === '') {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  // 문자열에서 숫자만 추출 (쉼표, 공백 제거)
  const cleaned = String(value).replace(/[,\s]/g, '')
  const parsed = parseFloat(cleaned)

  return isNaN(parsed) ? 0 : parsed
}
