[![](https://data.jsdelivr.com/v1/package/npm/padatika/badge)](https://www.jsdelivr.com/package/npm/padatika)

# 📝 Padatika

Got frustrated with managing footnotes manually? Padatika can help.

## 🦄 Features

- ✨ Sorts footnotes automatically.
- 🔢 No need to manually number your references.
- 📂 You can easily organize your footnotes into different categories.
- ⤴️ Wikipedia-like backlinks.
- 🌍 Localization.
- ♿ Accessibility.
- 🛠️ Super customizable with over a dozen options.

## 🚀 Getting started

Let's see an example to get familier with Padatika quickly.

First, load Padatika and initialize it like below:

```html
<script type="module">
  import padatika from 'https://cdn.jsdelivr.net/npm/padatika@0.1.0/dist/index.js';

  padatika({ notes: 'N' });
</script>
```

Now in the `<body>` of your HTML, paste the following:

```html
I like cats.<sup data-fnref>notes:cats</sup>

I like dogs.<sup data-fnref>notes:dogs</sup>

<h2 id="notes">Notes</h2>
<ul>
  <li>[cats] meow meow</li>
  <li>[dogs] woof woof</li>
</ul>
```

Now load the page in your browser with a local web server. You should see something like this:

![A simple footnote example with Padatika](./example-1.png)

## Concepts

In different contexts footnotes might have different meanings. Let's first clear it out what I mean by footnote here.

> Footnote is a text at the bottom part of the main content of a webpage that is linked to somewhere else in that page to give some more information.

So a footnote can is not limited to just your personal note on something, it can be a reference of a book, a glossary item etc.

You can mix all kinds of footnotes in a single section possibly with a heading named "Footnotes". You can also categorize them into multiple sections with headings possibly like "Notes", "References", "Glossary" etc.

## How to tell Padatika what you want to do

It all starts with initialzing padatika by passing an object to it. Below is an example:

```js
initPadatika({ notes: '' });
```

Here `notes` is your choosen id of the heading element of a category of footnotes you want to create. We will see very soon the role of the `""` that is passed to `notes`. Padatika will look for the heading element with id `notes`. The HTML for the heading would possibly will look like below:

```html
<h2 id="notes">Notes</h2>
```

Now let's create some footnotes. We have to create footnote in an unordered list. Padatika will make it ordered list and take care the hassle of ordering them in the right way. Each footnote must appear in `<li>` inside it and each should start with a unique name enclosed in square brackets like below:

```html
<h2 id="notes">Notes</h2>
<ul>
  <li>[example1] This is my first example footnote.</li>
  <li>[example2] This is my second example footnote.</li>
  <li>[example3] This is my third example footnote.</li>
</ul>
```

Now let's see how to create references to them. To create a reference to a footnote you have to create a `<sup>` element with the `data-padatika` empty attribute containing the name of the category, a colon and then the name of the footnote:

```html
<p>
  Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum
  sint consectetur cupidatat.<sup data-padatika>notes:example1</sup> Lorem ipsum
  dolor sit amet, qui minim labore adipisicing minim sint cillum sint
  consectetur cupidatat.<sup data-padatika>notes:example2</sup>
</p>

<p>
  Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum
  sint consectetur cupidatat.<sup data-padatika>notes:example3</sup>
</p>
<h2 id="notes">Notes</h2>
<ul>
  <li>[example1] This is my first example footnote.</li>
  <li>[example2] This is my second example footnote.</li>
  <li>[example3] This is my third example footnote.</li>
</ul>
```

It's time to reveal the meaning of the empty string passed to `notes` in the object passed to `initPadatika` call. It has two effects:

- In the output you don't see any category indicator at the start of your references because we set it to an empty string.
- You don't need to write the category name for this references to this category of footenotes. But if you want you can still do it for explicitness.

So we can rewrite the previous references like below:

```html
<p>
  Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum
  sint consectetur cupidatat.<sup data-padatika>example1</sup> Lorem ipsum dolor
  sit amet, qui minim labore adipisicing minim sint cillum sint consectetur
  cupidatat.<sup data-padatika>example2</sup>
</p>

<p>
  Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum
  sint consectetur cupidatat.<sup data-padatika>example3</sup>
</p>
```

On the otherhand if you pass something to the value of `notes`, for example `N`, it would cause the following effects:

- You must specify the category name in your references. This true even you have just one category. For example you would have to use `<sup data-padatika>notes:example3</sup>` instead of `<sup data-padatika>example3</sup>`.
- In the output you will see the category indicator `N` before your reference numbers. So the text in the superscript will be something like `[N 3]`.

In the first object passed to `initPadatika`, more than one category key can't have empty string or same string as its value. This value represents the category indicator in the references. Without category indicator, the numbers in references would conflict with other categories. This is why the values must be unique.
