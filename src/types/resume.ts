export interface Resume {
  id: string;
  name: string;
  variant: string;
  previewImage: string;
  createdAt: string;
  updatedAt: string;
  isStatic?: boolean;
}

export interface ResumeData {
  resumes: Resume[];
}
