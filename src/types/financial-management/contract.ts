// 계약 항목 타입
export interface Contract {
  contractId: number
  type: 'S' | 'P' // S: 매출(Sales), P: 매입(Purchase)
  year: number
  contractName: string
  companyName: string
  contractStart: string
  contractEnd: string
  invoiceRule: string
  paymentTerm: string
  totalAmount: number
  m01: number // 1월
  m02: number // 2월
  m03: number // 3월
  m04: number // 4월
  m05: number // 5월
  m06: number // 6월
  m07: number // 7월
  m08: number // 8월
  m09: number // 9월
  m10: number // 10월
  m11: number // 11월
  m12: number // 12월
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

// 계약 목록 응답 타입
export interface ContractListResponse {
  sales: Contract[]
  purchase: Contract[]
}

// 계약 등록/수정 요청 타입
export interface ContractRequest {
  type: 'S' | 'P' // S: 매출(Sales), P: 매입(Purchase)
  contractName: string
  companyName: string
  contractStart: string
  contractEnd: string
  invoiceRule: string
  paymentTerm: string
  year: number
  m01: number
  m02: number
  m03: number
  m04: number
  m05: number
  m06: number
  m07: number
  m08: number
  m09: number
  m10: number
  m11: number
  m12: number
}
