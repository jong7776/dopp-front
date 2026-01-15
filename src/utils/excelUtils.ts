import * as XLSX from 'xlsx'
import type { ExpenseRequest } from '../types/expense/expense'

/**
 * 샘플 엑셀 파일 다운로드
 */
export const downloadSampleExcel = () => {
  const sampleData = [
    {
      '경비명': '샘플 경비명',
      '연도': new Date().getFullYear(),
      '1월': 100000,
      '2월': 100000,
      '3월': 100000,
      '4월': 0,
      '5월': 0,
      '6월': 0,
      '7월': 0,
      '8월': 0,
      '9월': 0,
      '10월': 0,
      '11월': 0,
      '12월': 0,
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '경비')

  // 파일명에 현재 날짜 포함
  const fileName = `경비_샘플_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/**
 * 엑셀 파일 읽기 (등록/수정용)
 */
export const readExcelFile = (file: File): Promise<ExpenseRequest[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data || !(data instanceof ArrayBuffer)) {
          throw new Error('파일 데이터를 읽을 수 없습니다.')
        }
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<ExpenseRequest>(worksheet)
        
        resolve(jsonData)
      } catch (error) {
        reject(new Error('엑셀 파일 읽기 실패'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}
