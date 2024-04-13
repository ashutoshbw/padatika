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

> [!TIP]
> Above `padatika` is a default export. So you can name it anything else if you wish. But here, I will stick to this name.

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

Here, as you can see padatika automatically numbers for your footnotes. and add backlinks at the start of footnotes.

You've probably guessed how the linking is happening between footnotes and its references. Let's be clear about it and a few other things now so you can understand the rest of the doc easily:

- First, footnotes in padatika are organized by categories. A category is just a part of document starting with a heading element with an id containing the category name. In most case you will need just one or two categories, but you can have as many categories as you like in a similar fashion. You tell padatika to look for a category by passing its name as a key of a property of the object that you pass to `padatika`. We will see the role of the value of this property in a minute. First let's cover few other things.
- Below the category heading, you have to write your footnotes in `<li>` elements wrapped in an unordered list(`<ul>`). Padatika will convert it to an ordered list and sort your footnotes to match references order.
- Each footnote must start with a **name** wrapped with square brackets(`[]`) that is unique within the corresponding category. A name can be composed of a combination lowercase or uppercase English alphabets, numbers, dash(`-`) and underscore(`_`).
- To create a reference you have to use the following template: `<sup data-fnref>category_name:footnote_name</sup>`. For example, `<sup data-fnref>notes:cats</sup>` means, it links to a footnote of name `cats` under the `notes` category. Here `data-fnref` empty data attribute is used by padaika by default to collect the references for processing.
- Now let's talk about the `'N'` value given to the `notes` key in the object passed to `padatika` call. It's a footnote category indicator that you may want to see in your rendered references. In the example above it has no effect because by default Padatika doesn't show the category indicator for the first category that appears in the document. However it will appear if there is another category that comes before the "notes" category. You can also set the option `ignoreIndicatorOfFirstCategory` to `false` to make sure all category indicators appear. Options are set by passing another object to `padatika`. So the call to `padatika` in this case will look like below:

  ```js
  padatika({ notes: 'N' }, { ignoreIndicatorOfFirstCategory: false });
  ```

  Result:

  ![A simple footnote example with Padatika](./example-with-category-indicator.png)

## 🧩 Syntax of `padatika`

```js
padatika(categoryIdToCategoryIndicatorMap);
padatika(categoryIdToCategoryIndicatorMap, options);
```

### `categoryIdToCategoryIndicatorMap`

We have already seen how this object looks like and an example with one category in the [Getting started](#-getting-started) section. If you haven't read that section, go and read it first.

Let's see an example with two categories.

<table>
<thead><tr>
  <th align="left">Code</th>
  <th align="left">Rendered Result</th>
</tr></thead>
<tbody><tr valign="top"><td>

```html
<script type="module">
  import padatika from 'https://cdn.jsdelivr.net/npm/padatika@0.1.0/dist/index.js';

  padatika({ notes: 'N', refs: 'R' });
</script>

I like cats.<sup data-fnref>notes:cats</sup>

I like dogs.<sup data-fnref>notes:dogs</sup>

I smell something.<sup data-fnref>refs:something</sup>

<h2 id="notes">Notes</h2>
<ul>
  <li>[cats] meow meow</li>
  <li>[dogs] woof woof</li>
</ul>

<h2 id="refs">References</h2>
<ul>
  <li>[something] dog 💩</li>
</ul>
```

</td><td>

![A simple footnote example with two categories](./example-with-two-categories.png)

</td></tbody></table>
