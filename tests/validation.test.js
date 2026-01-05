const { validateEmail } = require('../public/assets/js/forms')

test('validates emails', () => {
  expect(validateEmail('a@b.com')).toBe(true)
  expect(validateEmail('bad')).toBe(false)
})
