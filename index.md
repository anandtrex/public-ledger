---
layout: default
title: Evidence, explained.
description: Independent visualisations and explainers on public life.
---

<header class="home-intro">
  <h1>Politics, economy &amp; society</h1>
  <p>Visualisations and explainers on public life.</p>
</header>

{% assign listed_pages = site.pages | where: "listed", true %}
{% assign entries = site.posts | concat: listed_pages | sort: "date" | reverse %}
<section class="home-posts" id="latest" aria-labelledby="latest-title">
  <div class="section-heading">
    <div>
      <h2 id="latest-title">Latest posts</h2>
    </div>
    <a class="text-link" href="#topics">Browse sections ↓</a>
  </div>
  <ul class="post-list">
    {% for entry in entries %}
    <li>
      <article class="post-preview">
        <div class="post-meta">
          <span class="post-section">{{ entry.section | default: entry.categories.first | default: 'Notes' | escape }}</span>
          <time datetime="{{ entry.date | date_to_xmlschema }}">{{ entry.date | date: "%d %B %Y" }}</time>
        </div>
        <h3><a href="{{ entry.url | relative_url }}">{{ entry.title | escape }}</a></h3>
        <p>{{ entry.description | default: entry.excerpt | strip_html | truncatewords: 40 | escape }}</p>
      </article>
    </li>
    {% else %}
    <li><p>New posts will appear here as they are published.</p></li>
    {% endfor %}
  </ul>
</section>

<section class="collection" id="topics" aria-labelledby="collection-title">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Browse by subject</p>
      <h2 id="collection-title">The collection</h2>
    </div>
    <span class="section-index">01 / 03</span>
  </div>
  <div class="topic-grid">
    <a class="topic-card topic-politics" href="{{ '/politics/' | relative_url }}">
      <span class="topic-number">01</span>
      <span class="topic-label">Representation · Policy · Power</span>
      <span class="topic-title">Politics</span>
      <span class="topic-arrow" aria-hidden="true">↗</span>
    </a>
    <a class="topic-card topic-economy" href="{{ '/economy/' | relative_url }}">
      <span class="topic-number">02</span>
      <span class="topic-label">Work · Wealth · Public finance</span>
      <span class="topic-title">Economy</span>
      <span class="topic-arrow" aria-hidden="true">↗</span>
    </a>
    <a class="topic-card topic-society" href="{{ '/society/' | relative_url }}">
      <span class="topic-number">03</span>
      <span class="topic-label">People · Place · Opportunity</span>
      <span class="topic-title">Society</span>
      <span class="topic-arrow" aria-hidden="true">↗</span>
    </a>
  </div>
</section>

<section class="principles" aria-labelledby="principles-title">
  <p class="eyebrow">Our approach</p>
  <h2 id="principles-title">Every chart should come with its context.</h2>
  <p>We show where the data comes from, what it measures, and what it leaves out. Numbers are a starting point for understanding, not a substitute for it.</p>
</section>
