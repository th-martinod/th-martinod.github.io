This post is a template. Copy it, change the slug, and add an entry to `blog/posts.json`.

## Inline and display math

Write inline math between single dollar signs, like $\lambda \in [0,1]$ or $\Delta_g u + \lambda u = 0$.

Display math goes between double dollar signs:

$$
\dot S_{\mathrm{gen}} = \sum_i \frac{\partial f}{\partial x_i}\,\dot x_i \ge 0 .
$$

To write a literal dollar sign, escape it: \$20.

## Everything else is Markdown

- Lists, **bold**, *italics*, [links](https://th-martinod.github.io)
- Images: put them in `blog/img/` and write `![caption](img/file.png)`

```python
import numpy as np
print(np.linalg.eigvalsh([[2, 1], [1, 2]]))
```

> Quotes look like this.
