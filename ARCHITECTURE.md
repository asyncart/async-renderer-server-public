# Architecture

The goal of this document is to provide information on renderer's tech design.

## premultiplied sharp option

As of Jan 2023, there is almost no documentation that goes deep into this option
so the below information is the result of [personal
experimentation](https://github.com/lovell/sharp/issues/3492).

In short, to make Sharp render output that matches the one in the browser,
`premultiplied` option needs to be set to `true` for certain blend modes like:

- hard-light
- screen
- lighten
- multiply
- overlay

Good blueprint examples used for testing this:

- [Everything everywhere](https://api.async-api.com/asyncCanvas/636c7281557e183c9f83e077/adminReview)
- [Emberpunk prophecy](https://api.async-api.com/asyncCanvas/625dd4f977ef05c8ee873d39/adminReview)
- [Fish’n’water](https://api.async-api.com/asyncCanvas/63005ebf0e3dfffcaa4fc23e/adminReview)
- [Euclidean space](https://api.async-api.com/asyncCanvas/6210b0d60e78449a3bc62e16/adminReview)
- [Artis Machina Infinita](https://api.async-api.com/asyncCanvas/61be707592516fc1f6c1b25b/adminReview)
- [The Village Of Limitless Potential](https://api.async-api.com/asyncCanvas/62055b6e3e98af596b18d3b7/adminReview)
- [The Woman And The Wind](https://api.async-api.com/asyncCanvas/61e9662e8c74e7aeafa49bdb/adminReview)
- [Fractal Fever Dreams](https://api.async-api.com/asyncCanvas/61fb6677cf78577707f2ece1/adminReview)
- [Сharacter](https://api.async-api.com/asyncCanvas/623cbaae137fe9843bd4e9f6/adminReview)
