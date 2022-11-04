(() => {
  const call = () => {
    const searchQuery = getQueryVariable('query')

    if (!searchQuery) { return }

    document.getElementById('search-box').setAttribute('value', searchQuery)

    const index = generateIndex()
    const results = index.search(searchQuery)

    displaySearchResults(results, searchQuery)
    setHeading(results.length, searchQuery)
  }

  const getQueryVariable = (variable) => {
    const urlQueryString = window.location.search
    const urlParams = new URLSearchParams(urlQueryString)

    return urlParams.get(variable)
  }

  const generateIndex = () => {
    const index = elasticlunr(function () {
      this.addField('title')
      this.addField('content')
      this.setRef('id')

      this.pipeline.remove(lunr.stemmer)
    })

    const pages = Object.entries(window.store)

    pages.forEach(([pageKey, page]) => {
      const content = formatContent(page.content)

      if (!content) { return }

      window.store[pageKey].content = content

      index.addDoc({
        id: pageKey,
        title: page.title,
        content: page.content
      })
    })

    return index
  }

  const formatContent = (rawContent) => {
    return rawContent
      .replace(/([.?!])[\n\s]{2,}/g, '$1 ')
      .replace(/[\n\s]{2,}/g, '. ')
      .replace(/\n/, ' ')
      .trim()
      .replace(/^.$/, '')
  }

  const displaySearchResults = (results, searchQuery) => {
    const searchResultsElement = document.getElementById('search-results')

    if (!results.length) {
      searchResultsElement.innerHTML = '<li class="search-results__no-results-message">No results found.</li>'
      return
    }

    let innerHtml = ''

    results.forEach((result) => {
      const item = window.store[result.ref]

      const breadcrumbs = item.url
        .replace('.html', '')
        .replace(/-/g, ' ')
        .split('/')
        .filter(i => i)
        .map(breadcrumb => breadcrumb[0].toUpperCase() + breadcrumb.substring(1))

      breadcrumbs.pop()

      const breadcrumbsString = breadcrumbs.join(' > ')
      const excerpt = getExcerpt(item.content, searchQuery)

      innerHtml +=
        '<li class="search-results__result">' +
          `<a href="${item.url}">` +
            `<h2 class="search-results__result-title">${item.title}</h2>` +
          '</a>' +
          (breadcrumbs.length ? `<div class="search-results__result-breadcrumbs">${breadcrumbsString}</div>` : '') +
          `<p class="search-results__result-excerpt">...${excerpt}...</p>` +
        '</li>'
    })

    searchResultsElement.innerHTML = innerHtml
  }

  const getExcerpt = (content, searchQuery) => {
    const queryRegex = new RegExp(searchQuery, 'i')
    const matchIndex = content.search(queryRegex)
    const queryLength = searchQuery.length
    const excerpt = content.slice(
      getStartIndex(matchIndex, content),
      getEndIndex(matchIndex, queryLength, content)
    )

    return excerpt.replace(
      queryRegex,
      '<strong class="search-results__matching-keyword">$&</strong>'
    )
  }

  const getStartIndex = (matchIndex, content) => {
    let startIndex = Math.max(matchIndex - 100, 0)

    while (startIndex > 0 && content[startIndex] !== ' ') {
      startIndex = startIndex - 1
    }

    if (content[startIndex] === ' ') { startIndex++ }

    return startIndex
  }

  const getEndIndex = (matchIndex, queryLength, content) => {
    matchIndex = Math.max(matchIndex, 100)

    let endIndex = Math.min(matchIndex + queryLength + 100, content.length)

    while (endIndex !== content.length && content[endIndex] !== ' ') {
      endIndex++
    }

    return endIndex
  }

  const setHeading = (resultsCount, searchQuery) => {
    const searchHeading = document.getElementById('search-heading')

    const resultsLabel = resultsCount === 1 ? 'result' : 'results'

    searchHeading.innerText = `Showing ${resultsCount} ${resultsLabel} for "${searchQuery}"`
  }

  call()
})()
