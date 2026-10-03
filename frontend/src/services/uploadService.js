import { api } from './api';

export async function uploadFile(blob, filename) {
  const form = new FormData();
  form.append('file', blob, filename);
  const data = await api.post('/uploads', form, { isForm: true });
  return data.url;
}
