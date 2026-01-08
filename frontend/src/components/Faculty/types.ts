export type Announcement = {
  type: 'batch' | 'test';
  title: string;
  testType?: string;
  createdAt: string;
  institution?: string;
};

export type Student = { _id: string; name?: string; regno?: string; username: string; email?: string };

export type Batch = {
  _id: string;
  name: string;
  students: Student[];
  createdAt: string;
  createdBy?: { name?: string; institutionId?: string };
};
