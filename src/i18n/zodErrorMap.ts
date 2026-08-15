import { z, ZodIssueCode } from 'zod';
import i18n from 'i18next';

/**
 * Global Zod error map that routes built-in validation messages through i18next.
 * Reads the current language at parse time, so schemas stay module-level singletons
 * and don't need to be rebuilt when the user switches language.
 */
const zodI18nErrorMap: z.ZodErrorMap = (issue, ctx) => {
  const t = i18n.t.bind(i18n);
  const fieldName = String(issue.path[issue.path.length - 1] ?? '');

  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        return { message: t('validation.required') };
      }
      return { message: t('validation.invalidType') };

    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: t('validation.email') };
      }
      return { message: ctx.defaultError };

    case ZodIssueCode.too_small: {
      if (issue.type === 'string') {
        if (issue.exact) {
          return fieldName === 'code'
            ? { message: t('validation.otpLength') }
            : { message: t('validation.exactLength', { count: issue.minimum }) };
        }
        if (issue.minimum === 1) {
          return { message: t('validation.required') };
        }
        if (fieldName === 'password') {
          return { message: t('validation.passwordMin') };
        }
        return { message: t('validation.minLength', { count: issue.minimum }) };
      }
      if (issue.type === 'number') {
        return { message: t('validation.tooSmallNumber', { count: issue.minimum }) };
      }
      return { message: ctx.defaultError };
    }

    case ZodIssueCode.too_big: {
      if (issue.type === 'string') {
        return { message: t('validation.maxLength', { count: issue.maximum }) };
      }
      return { message: ctx.defaultError };
    }

    default:
      return { message: ctx.defaultError };
  }
};

export function registerZodI18nErrorMap() {
  z.setErrorMap(zodI18nErrorMap);
}
