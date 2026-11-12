import crypto from 'node:crypto';

process.env.NODE_ENV ||= 'test';
process.env.JWT_SECRET ||= crypto.randomBytes(48).toString('hex');
process.env.COOKIE_SECRET ||= crypto.randomBytes(48).toString('hex');
process.env.DATABASE_URL ||= 'postgresql://unit_test:unit_test@127.0.0.1:59999/unit_test_unused';
process.env.ENABLE_DEMO_RESET ||= 'true';
