type LogContext = Record<string, unknown>;

function serialize(context?: LogContext) {
  return context ? ` ${JSON.stringify(context)}` : "";
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(`[info] ${message}${serialize(context)}`);
  },
  warn(message: string, context?: LogContext) {
    console.warn(`[warn] ${message}${serialize(context)}`);
  },
  error(message: string, context?: LogContext) {
    console.error(`[error] ${message}${serialize(context)}`);
  }
};

