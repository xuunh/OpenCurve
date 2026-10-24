# Contributing to OpenCurve

Thanks for helping. OpenCurve is a place to see math, so the most useful help is anything that makes a model more accurate or easier to understand.

## Ways to help

- **Report a math mistake.** A wrong equation, a label that doesn't match its model, or a shape that's drawn wrong. [Report a math mistake](https://github.com/xuunh/OpenCurve/issues/new?template=math-mistake.yml)
- **Suggest a topic or a visual.** Something you or your students struggle to picture. [Suggest a topic](https://github.com/xuunh/OpenCurve/issues/new?template=topic-request.yml)
- **Report a bug.** Something broken, slow, or hard to read. Say which browser and device you used. [Report a bug](https://github.com/xuunh/OpenCurve/issues/new?template=bug.yml)
- **Send a fix or a model.** Open a pull request (see below).

## Working on the code

The site is four plain files, with no build step and nothing to install:

- `index.html`: page structure and content
- `style.css`: all the styling
- `loader.js`: the loading screen and reset-to-top on reload
- `main.js`: the custom cursor, the subjects, and every 2D and 3D model

1. Fork the repo and clone your fork.
2. Run `python3 -m http.server` in the folder and open http://localhost:8000.
3. Make your change in the file that fits (see below).
4. Check it in a desktop browser at laptop size, and if you can, on a Chromebook or a projector.
5. Open a pull request that says what you changed and why.

### House rules

- **Every model comes from real math.** If you add or change one, put its equation or a plain description in the subject's `label`.
- **Models are never centered.** Each one has its own hand-placed spot in `PLACE`. Keep yours off-center too.
- **Write comments in plain words**, so a student reading the code can follow it.
- **Respect reduced motion.** Anything that moves should calm down when the visitor's system asks for less motion.
- **Desktop first.** There's no phone layout yet, so focus on laptops and classroom screens.

### Where things are

| What | Where to look |
|---|---|
| Subject list (names, descriptions, colors, labels) | `var SUBJECTS` in `main.js` |
| How each 3D model is built | the `BUILD` functions in `main.js`, keyed by `form` |
| Where each model sits on screen | `var PLACE` in `main.js` |
| The cover and intro screens | `#intro` and the `.beat` sections in `index.html`, styled in `style.css` |

## License

By contributing, you agree that your contributions are released under the [MIT License](LICENSE).
