export const formatSuccessResponse = (message: string, data: any) => ({
  status: "success",
  message,
  data,
});

export const formatErrorResponse = (message: string, code = 500) => ({
  status: "error",
  message,
  data: null,
  code,
});