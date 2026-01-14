import * as XLSX from 'xlsx'
import type { Expense, ExpenseRequest } from '../types/expense/expense'

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
 * 경비 목록 엑셀 다운로드
 */
export const downloadExpenseListExcel = (expenses: Expense[]) => {
  // 엑셀에 표시할 데이터 변환
  const excelData = expenses.map((expense) => ({
    '경비명': expense.expenseName,
    '연도': expense.year,
    '1월': expense.m01,
    '2월': expense.m02,
    '3월': expense.m03,
    '4월': expense.m04,
    '5월': expense.m05,
    '6월': expense.m06,
    '7월': expense.m07,
    '8월': expense.m08,
    '9월': expense.m09,
    '10월': expense.m10,
    '11월': expense.m11,
    '12월': expense.m12,
    '합계': expense.totalAmount,
    '생성일': expense.createdAt.split('T')[0],
    '수정일': expense.updatedAt.split('T')[0],
  }))

  const worksheet = XLSX.utils.json_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '경비목록')

  // 컬럼 너비 자동 조정
  const colWidths = [
    { wch: 20 }, // 경비명
    { wch: 8 },  // 연도
    { wch: 12 }, // 1월~12월
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }, // 합계
    { wch: 12 }, // 생성일
    { wch: 12 }, // 수정일
  ]
  worksheet['!cols'] = colWidths

  const fileName = `경비목록_${new Date().toISOString().split('T')[0]}.xlsx`
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
