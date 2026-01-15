import * as XLSX from 'xlsx'
import type { ExpenseRequest } from '../types/financial-management/expense'

/**
 * 경비 샘플 엑셀 파일 다운로드
 */
export const downloadExpenseSampleExcel = () => {
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
 * 계약 샘플 엑셀 파일 다운로드
 */
export const downloadContractSampleExcel = () => {
  const sampleData = [
    {
      '계약 구분(S: 매출, P: 매입)': 'S',
      '적용 연도': new Date().getFullYear(),
      '계약명': '샘플 계약명',
      '업체명': '샘플 업체명',
      '계약 시작일': '2026-01-01',
      '계약 종료일': '2026-12-31',
      '계산서 발행 기준': '매월 말일',
      '지급 조건': '30일 이내',
      '1월 금액': 1000000,
      '2월 금액': 1000000,
      '3월 금액': 1000000,
      '4월 금액': 0,
      '5월 금액': 0,
      '6월 금액': 0,
      '7월 금액': 0,
      '8월 금액': 0,
      '9월 금액': 0,
      '10월 금액': 0,
      '11월 금액': 0,
      '12월 금액': 0,
    },
    {
      '계약 구분(S: 매출, P: 매입)': 'P',
      '적용 연도': new Date().getFullYear(),
      '계약명': '프리랜서',
      '업체명': '홍길동동',
      '계약 시작일': '2026-01-01',
      '계약 종료일': '2026-12-31',
      '계산서 발행 기준': '매월 말일',
      '지급 조건': '30일 이내',
      '1월 금액': 2000000,
      '2월 금액': 2000000,
      '3월 금액': 2000000,
      '4월 금액': 0,
      '5월 금액': 0,
      '6월 금액': 0,
      '7월 금액': 0,
      '8월 금액': 0,
      '9월 금액': 0,
      '10월 금액': 0,
      '11월 금액': 0,
      '12월 금액': 0,
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '계약')

  // 파일명에 현재 날짜 포함
  const fileName = `계약_샘플_${new Date().toISOString().split('T')[0]}.xlsx`
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
