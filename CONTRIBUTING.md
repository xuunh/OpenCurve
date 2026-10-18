# How to add or fix a topic

Every topic is one small file in the `data/` folder. No coding needed.

## Add a new topic (all on github.com, no installs)

1. **Copy the template.** Open [`templates/topic-template.json`](templates/topic-template.json) and copy everything.
2. **Make the file.** Go to `data/algebra-1/` (or `data/algebra-2/`) → **Add file** → **Create new file**.
   Name it with dashes, like `point-slope-form.json`. Paste the template.
3. **Fill it in.** Change the words, formula, sliders, example, and practice problem.
   The `id` must match the file name (without `.json`).
4. **List it.** Open `data/catalog.json` and add your file path to the right course, in the order it should appear.
5. **Commit.** The "Check topics" test runs automatically. Green check = it's live on the site in about a minute.

Not the repo owner? Do the same steps — GitHub will turn it into a **pull request** (a change waiting for approval).

## What each part does

| Field | What it is |
|---|---|
| `formula` | The main equation, written in LaTeX (math typing code). Example: `y = a(x - h)^2 + k` |
| `summary` | 1–2 sentences under the title |
| `explanation` | Short bullet points in plain words |
| `symbols` | A table: each letter and what it means |
| `graph.params` | The sliders. Each has `min`, `max`, `step`, starting `value`, and a `label` |
| `graph.curves` | What gets drawn. `expr` is the right side of `y = ...` using `x` and your slider names |
| `graph.marks` | Extras: `point` (dot with coordinates), `vline` / `hline` (dashed lines like asymptotes) |
| `graph.live` | The equation that updates as sliders move (see below) |
| `graph.window` | Starting view of the graph |
| `watchFor` | Things to notice while dragging sliders |
| `example` | Worked problem — students click through one step at a time |
| `practice` | One problem with a hidden answer |

### Writing curve expressions

- Use `*` for multiply: `2*x`, not `2x`
- Use `^` for powers: `x^2`
- Allowed functions: `sqrt`, `abs`, `log` (natural log), `exp`, `sin`, `cos`, `tan`, `pi`
- Log base b: `log(x)/log(b)`

### Live equation codes

| Code | Shows | Example (h = -2) |
|---|---|---|
| `{h}` | the value | `-2` |
| `{+h}` | with a plus/minus sign | `- 2` |
| `{-h}` | for `(x - h)` style | `+ 2` |
| `{*a}` | a number in front of x (hides 1, shows −1 as −) | `-2`, or nothing if a = 1 |
| `{=b^2-4*a*c}` | a calculated number | `16` |
| `\qquad` | puts the next part on a new line | |

## Check your work on your own computer (optional)

```bash
node tools/validate.js        # checks every topic file
python3 -m http.server 8000   # then open http://localhost:8000
```

## Writing style

- Short sentences. Plain words. Define any math word the first time you use it.
- One idea per bullet.
- Examples should use small, clean numbers.
