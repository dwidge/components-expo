type File2Key = {
  id: string;
};
type File2Get = {
  id?: string | undefined;
  CompanyId?: number | null | undefined;
  created?: boolean | undefined;
  createdAt?: number | undefined;
  createdBy?: number | null | undefined;
  size?: number | null | undefined;
  mime?: string | null | undefined;
  sha256?: string | null | undefined;
  getUrl?: string | null | undefined;
  putUrl?: string | null | undefined;
};
type File2Set = {
  id?: string | undefined;
  CompanyId?: number | null | undefined;
  created?: boolean | undefined;
  size?: number | null | undefined;
  mime?: string | null | undefined;
  sha256?: string | null | undefined;
};
type File2Result = File2Key | null;
export type UseFile2 = [
  File2Get | null | undefined,
  ((item: File2Set | null) => Promise<File2Result>) | undefined,
];
