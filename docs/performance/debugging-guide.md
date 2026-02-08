---
type: guide
title: Leitfaden zur Performance-Debugging und Optimierung
created: 2025-02-08
tags:
  - performance
  - debugging
  - devtools
  - optimization
related:
  - '[[CLAUDE-PERFORMANCE.md]]'
  - '[[scripts/performance-profiler.js]]'
---

# Leitfaden zur Performance-Debugging und Optimierung

Dieser Leitfaden bietet eine umfassende Anleitung zur Identifizierung und Behebung von Performance-Problemen in Electron- und React-Anwendungen mit Fokus auf Timer-basierte Probleme und Garbage Collection.

## Inhaltsverzeichnis

- [DevTools Performance-Workflow](#devtools-performance-workflow)
- [Timer-Identifikationsmuster](#timer-identifikationsmuster)
- [Häufige Allokationsmuster](#häufige-allokationsmuster)
- [Console Profiler Snippet](#console-profiler-snippet)
- [Checkliste für Common Fixes](#checkliste-für-common-fixes)

---

## DevTools Performance-Workflow

### Performance-Panel öffnen und profilieren

1. **DevTools öffnen:**
   - In Electron: `View → Toggle Developer Tools` oder `Ctrl+Shift+I` (Linux/Windows) / `Cmd+Option+I` (macOS)
   - Wählen Sie den Tab "Performance" (früher "Timeline" genannt)

2. **Profil-Aufnahme starten:**
   - Klicken Sie auf den **Runden Record-Button** (links oben) oder drücken Sie `Ctrl+E` / `Cmd+E`
   - Führen Sie die Aktionen aus, die Sie untersuchen möchten
   - Klicken Sie erneut auf den Record-Button, um die Aufnahme zu stoppen

3. **Profil analysieren:**
   - Die Aufnahme zeigt eine Zeitachse mit verschiedenen Spalten (Main, GPU, Network, etc.)
   - Zoomen Sie in interessierende Bereiche mit dem Mausrad oder ziehen Sie ein Auswahlrechteck

### Navigation in Bottom-Up / Call Tree Views

**Bottom-Up View:**

- Zeigt, welche Funktionen die meiste CPU-Zeit verbrauchen
- Perfekt, um Hotspots zu identifizieren, unabhängig davon, wo sie aufgerufen wurden
- Nutzen Sie, wenn Sie wissen, dass eine langsame Funktion existiert, aber nicht wissen, von wo sie aufgerufen wird

**Call Tree View:**

- Zeigt die Aufrufhierarchie der Funktionen
- Hilfreich, um den Ausführungspfad zu verstehen
- Nutzen Sie, um zu sehen, wie eine Funktion aufgerufen wurde

**Tipps für effizientes Navigieren:**

- Verwenden Sie die Suchfunktion (`Ctrl+F` / `Cmd+F`) im Panel
- Klicken Sie auf Frame-Namen, um sie aufzuklappen
- Sortieren Sie nach "Total Time", "Self Time" oder "Activity"
- Nutzen Sie die "Invert Call Tree"-Option, um die Perspektive zu wechseln

### "Reveal in Sources panel" verwenden

Wenn Sie einen Performance-Hotspot gefunden haben:

1. Klicken Sie mit der rechten Maustaste auf den Frame im Performance-Panel
2. Wählen Sie **"Reveal in Sources panel"**
3. Der Sources-Panel öffnet sich und zeigt die exakte Code-Zeile
4. Sie können nun:
   - Breakpoints setzen
   - Variablen inspizieren
   - Änderungen direkt vornehmen (gespeichert nur während der DevTools-Sitzung)

### Sourcemaps aktivieren und minifizierten Code lesbar machen

**Sourcemaps aktivieren:**

1. Öffnen Sie DevTools → "Settings" (Zahnrad-Symbol oben rechts)
2. Gehen Sie zum Abschnitt "Preferences" → "Sources"
3. Aktivieren Sie **"Enable JavaScript source maps"**
4. Aktivieren Sie **"Enable CSS source maps"** (falls nötig)

**Minifizierten Code pretty-printen:**

1. Gehen Sie zum "Sources"-Panel
2. Öffnen Sie die minifizierte Datei
3. Klicken Sie auf den **Pretty-Print-Button** (Symbol: `{ }` unten links im Editor)
4. Der Code wird automatisch formatiert und lesbar
5. Sourcemaps werden automatisch angewendet, falls verfügbar

---

## Timer-Identifikationsmuster

Timer-basierte Probleme sind eine häufige Ursache für schlechte Performance in Electron-Apps. Hier ist, wie man sie identifiziert.

### Timer im Performance-Panel suchen

1. Suchen Sie nach diesen Mustern im Performance-Panel:
   - `setTimeout`
   - `setInterval`
   - `requestAnimationFrame`
   - `queueMicrotask`

2. Suchfilter im Call Tree verwenden:

   ```
   // Im Performance-Panel Suchfeld eingeben
   setTimeout
   setInterval
   requestAnimationFrame
   ```

3. Häufige Timer-Hotspots in Electron/React:
   - Event-Handler, die zu oft feuern
   - Polling-Mechanismen mit zu kurzen Intervallen
   - UI-Updates, die nicht batched werden
   - Animationen, die nicht `requestAnimationFrame` verwenden

### Rekursive setTimeout-Patterns und 0ms-Intervalle

**Rekursive setTimeout (setTimeout in setTimeout):**

```javascript
// ❌ SCHLECHT: Rekursive setTimeout ohne Kontrolle
function pollServer() {
	fetch('/api/status')
		.then((data) => updateUI(data))
		.then(() => setTimeout(pollServer, 100)); // Immer 100ms!
}

pollServer();
```

**Problem:** Der Timer feuert immer wieder, selbst wenn der Fetch-Request länger dauert als 100ms. Dies führt zu überlappenden Requests und hoher CPU-Auslastung.

**Lösung:**

```javascript
// ✅ GUT: Nur neuen Timer starten, nachdem der vorherige fertig ist
function pollServer() {
	fetch('/api/status').then((data) => {
		updateUI(data);
		setTimeout(pollServer, 1000); // 1000ms ist realistischer
	});
}

pollServer();
```

**0ms-Intervalle:**

```javascript
// ❌ SCHLECHT: 0ms-Intervall führt zu 60+ Aufrufen pro Sekunde
setInterval(() => {
	checkStatus();
}, 0); // 0ms = so schnell wie möglich!
```

**Problem:** Der Browser führt diesen Code so schnell aus wie möglich (bis zu 60x pro Sekunde), was die CPU überlastet.

**Lösung:**

```javascript
// ✅ GUT: Realistisches Intervall
setInterval(() => {
	checkStatus();
}, 1000); // Einmal pro Sekunde ist ausreichend für Status-Checks

// Oder für UI-Updates:
requestAnimationFrame(() => {
	updateUI();
}); // Synchron mit der Bildwiederholrate (typischerweise 60fps)
```

### Fehlende clearInterval/clearTimeout Cleanup-Aufrufe

**Problem:** Timer werden erstellt, aber nie bereinigt. Dies führt zu "Zombie-Timern", die auch nach dem Unmounten einer Komponente weiterlaufen.

**Beispiel für Memory Leak:**

```javascript
// ❌ SCHLECHT: Timer wird nicht bereinigt
function MyComponent() {
	useEffect(() => {
		const timer = setInterval(() => {
			console.log('Tick');
		}, 1000);
		// Timer wird NIE bereinigt!
	}, []);

	return <div>...</div>;
}
```

**Korrekte Implementierung:**

```javascript
// ✅ GUT: Timer wird beim Unmount bereinigt
function MyComponent() {
	useEffect(() => {
		const timer = setInterval(() => {
			console.log('Tick');
		}, 1000);

		// Cleanup-Funktion wird beim Unmount aufgerufen
		return () => {
			clearInterval(timer);
		};
	}, []);

	return <div>...</div>;
}
```

**Muster zum Überprüfen auf fehlende Cleanup:**

1. Suchen Sie im Performance-Panel nach Timern, die nach dem Unmounten einer Komponente weiterlaufen
2. Überprüfen Sie alle `useEffect`-Hooks auf fehlende Cleanup-Funktionen
3. Suchen Sie nach `setInterval`/`setTimeout` ohne entsprechendes `clearInterval`/`clearTimeout`
4. Verwenden Sie Lint-Regeln wie `react-hooks/exhaustive-deps` um fehlende Dependencies zu finden

---

## Häufige Allokationsmuster

Zu viele Allokationen führen zu häufigen Minor GC-Cycles, die zu Stottern und schlechter Performance führen. Hier sind die häufigsten Ursachen.

### Array-Methoden, die neue Arrays erstellen

**Problem:** Array-Methoden wie `map`, `filter`, `slice`, `concat` erstellen neue Arrays. In Schleifen oder Render-Zyklen können diese Allokationen massiv sein.

```javascript
// ❌ SCHLECHT: Neue Arrays in jedem Render
function MyList({ items }) {
	// Jedes Mal ein neues Array!
	const filtered = items.filter((item) => item.active);
	const mapped = filtered.map((item) => ({
		...item,
		displayName: `${item.firstName} ${item.lastName}`,
	}));

	return (
		<ul>
			{mapped.map((item) => (
				<li>{item.displayName}</li>
			))}
		</ul>
	);
}
```

**Lösung:**

```javascript
// ✅ GUT: Memoisierung mit useMemo
import { useMemo } from 'react';

function MyList({ items }) {
	const filteredItems = useMemo(() => items.filter((item) => item.active), [items]);

	const displayItems = useMemo(
		() =>
			filteredItems.map((item) => ({
				...item,
				displayName: `${item.firstName} ${item.lastName}`,
			})),
		[filteredItems]
	);

	return (
		<ul>
			{displayItems.map((item) => (
				<li>{item.displayName}</li>
			))}
		</ul>
	);
}
```

**Weitere Optimierungen:**

```javascript
// Array-Methoden in Schleifen vermeiden
const results = [];
for (const item of items) {
	if (item.active) {
		// Filter-Logik inline
		results.push({
			// Push anstelle von map
			...item,
			displayName: `${item.firstName} ${item.lastName}`,
		});
	}
}
```

### JSON.stringify/JSON.parse Operationen

**Problem:** JSON-Serialisierung und -Deserialisierung sind langsam und erzeugen viel temporären Speicher.

```javascript
// ❌ SCHLECHT: JSON-Operationen in Schleife oder Render
function MyComponent({ data }) {
	const processed = JSON.parse(JSON.stringify(data)); // Deep Clone!

	return <div>{JSON.stringify(processed)}</div>;
}
```

**Lösung:**

```javascript
// ✅ GUT: Strukturiertes Clone oder shallow copy
import { useMemo } from 'react';

function MyComponent({ data }) {
	const processed = useMemo(() => {
		// Strukturiertes Clone für verschachtelte Objekte
		return structuredClone(data);
	}, [data]);

	// Oder shallow copy für flache Objekte
	const shallowCopy = { ...data };

	return <div>{/* JSON.stringify nur für Debugging */}</div>;
}
```

**Wann JSON.stringify/parse verwenden:**

- Nur für Debugging-Logs
- Nur für Persistierung (localStorage, Dateisystem)
- Niemals in Performance-kritischem Code (Render-Zyklen, Event-Handler)

### String-Konkatenation in Schleifen

**Problem:** String-Konkatenation erzeugt bei jeder Operation ein neues String-Objekt.

```javascript
// ❌ SCHLECHT: String-Konkatenation in Schleife
function buildList(items) {
	let result = '';
	for (const item of items) {
		result += `<li>${item.name}</li>`; // Neues String-Objekt!
	}
	return `<ul>${result}</ul>`;
}
```

**Lösung:**

```javascript
// ✅ GUT: Array-Join für effizientes String-Building
function buildList(items) {
	const parts = items.map((item) => `<li>${item.name}</li>`);
	return `<ul>${parts.join('')}</ul>`;
}

// ✅ Noch besser: Template-Literal (automatisch optimisiert)
function buildList(items) {
	return `<ul>${items.map((item) => `<li>${item.name}</li>`).join('')}</ul>`;
}
```

### Exzessives Logging und Klonen

**Problem:** Zu viele Log-Statements oder unnötige Klon-Operationen in hot paths.

```javascript
// ❌ SCHLECHT: Logging in hot paths
function renderFrame() {
	console.log('Rendering frame', frame++); // Langsam in der Konsole!

	for (const item of items) {
		console.log('Processing item', item); // Noch langsamer!
		processItem(item);
	}
}
```

**Lösung:**

```javascript
// ✅ GUT: Conditional Logging mit Debug-Flag
const DEBUG = false;

function renderFrame() {
	if (DEBUG) {
		console.log('Rendering frame', frame++);
	}

	for (const item of items) {
		if (DEBUG) {
			console.log('Processing item', item);
		}
		processItem(item);
	}
}
```

**Unnötiges Klonen:**

```javascript
// ❌ SCHLECHT: Unnötiges Klonen
function processData(data) {
	const cloned = structuredClone(data); // Warum klonen?
	// ... nichts verändert
	return cloned;
}

// ✅ GUT: Nur klonen, wenn nötig
function processData(data) {
	if (needsClone(data)) {
		return structuredClone(data);
	}
	return data; // Direkt zurückgeben
}
```

---

## Console Profiler Snippet

Dieses Snippet können Sie direkt in die Chrome DevTools Console einfügen, um Timer-Hotspots in Echtzeit zu identifizieren.

```javascript
/**
 * Timer Profiler für Browser Console
 *
 * Kopieren Sie dieses Snippet und fügen Sie es in die Console ein.
 * Es wird setTimeout/setInterval Aufrufe für 5 Sekunden überwachen
 * und die Top 20 Call-Sites nach Häufigkeit anzeigen.
 */

(() => {
	// Original Timer-Funktionen speichern
	const originalSetTimeout = window.setTimeout;
	const originalSetInterval = window.setInterval;
	const originalClearTimeout = window.clearTimeout;
	const originalClearInterval = window.clearInterval;

	// Timer-Statistiken
	const timerStats = new Map();
	const activeTimers = new Set();

	/**
	 * Extrahiert Call-Site aus Stack-Trace
	 */
	function extractCallSite(stack) {
		if (!stack) return '<unknown>';

		const lines = stack.split('\n');
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			const match = line.match(/at\s+(?:([^\s]+)\s+)?\(?([^\s]+?):(\d+):(\d+)\)?/);
			if (match) {
				const [, func, path, line] = match;
				const filename = path.split('/').pop();
				return func ? `${filename}:${line} (${func})` : `${filename}:${line}`;
			}
		}
		return '<unknown>';
	}

	/**
	 * Timer-Aufruf protokollieren
	 */
	function recordTimer(type, stack) {
		const site = extractCallSite(stack);

		if (timerStats.has(site)) {
			timerStats.get(site).count++;
			timerStats.get(site).type = type;
		} else {
			timerStats.set(site, {
				count: 1,
				type,
				site,
				stack,
			});
		}
	}

	// Timer-Wrapper installieren
	window.setTimeout = function (callback, delay, ...args) {
		recordTimer('setTimeout', new Error().stack);
		const id = originalSetTimeout(callback, delay, ...args);
		activeTimers.add(id);
		return id;
	};

	window.setInterval = function (callback, delay, ...args) {
		recordTimer('setInterval', new Error().stack);
		const id = originalSetInterval(callback, delay, ...args);
		activeTimers.add(id);
		return id;
	};

	window.clearTimeout = function (id) {
		activeTimers.delete(id);
		return originalClearTimeout(id);
	};

	window.clearInterval = function (id) {
		activeTimers.delete(id);
		return originalClearInterval(id);
	};

	console.log('🚀 Timer Profiler gestartet - wird für 5 Sekunden laufen...');

	// Nach 5 Sekunden Ergebnisse anzeigen und aufräumen
	setTimeout(() => {
		// Original-Funktionen wiederherstellen
		window.setTimeout = originalSetTimeout;
		window.setInterval = originalSetInterval;
		window.clearTimeout = originalClearTimeout;
		window.clearInterval = originalClearInterval;

		// Ergebnisse sortieren und anzeigen
		const results = Array.from(timerStats.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 20);

		console.log('═══════════════════════════════════════════════════════════════');
		console.log('📊 TIMER PROFILER ERGEBNISSE');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log(`Gesamte Timer-Aufrufe: ${results.reduce((sum, s) => sum + s.count, 0)}`);
		console.log(`Aktive Timer (nicht bereinigt): ${activeTimers.size}`);
		console.log('═══════════════════════════════════════════════════════════════');
		console.log('');

		results.forEach((r, i) => {
			const percentage = ((r.count / results.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(
				1
			);
			console.log(`${i + 1}. ${percentage}% (${r.count}x) [${r.type.padEnd(12)}] ${r.site}`);
		});

		console.log('');
		console.log('✅ Profiling abgeschlossen. Timer-Funktionen wiederhergestellt.');
	}, 5000);
})();
```

**Verwendung:**

1. Öffnen Sie Chrome DevTools Console in Ihrer Electron-App
2. Kopieren Sie das gesamte Snippet
3. Fügen Sie es in die Console ein und drücken Sie Enter
4. Führen Sie die Aktionen aus, die Sie profilieren möchten (Innerhalb von 5 Sekunden)
5. Die Ergebnisse werden automatisch in der Console angezeigt

**Ergebnis-Interpretation:**

- Hohe Prozentwerte (z.B. >10%) zeigen Timer-Hotspots
- Sehr häufige Aufrufe (z.B. >100x in 5s) deuten auf Probleme
- `setInterval` mit kurzen Intervallen (z.B. <100ms) sollten untersucht werden
- Aktive Timer, die nicht bereinigt wurden, zeigen Memory Leaks

---

## Checkliste für Common Fixes

Verwenden Sie diese Checkliste, um Performance-Probleme systematisch zu beheben.

### ✅ Timer-Frequenz reduzieren oder requestAnimationFrame verwenden

- [ ] **Alle setInterval-Intervalle überprüfen:**
  - Sind Intervalle <100ms? Erhöhen Sie auf mindestens 100ms oder 1s
  - Können Sie stattdessen `requestAnimationFrame` verwenden? (Für UI-Updates)
  - Können Sie Event-basierte Updates verwenden? (z.B. `window.addEventListener('resize')`)

- [ ] **setTimeout-Verzögerungen optimieren:**
  - Sind 0ms-Delays? Erhöhen Sie auf mindestens 16ms (60fps)
  - Können Sie die Verzögerung erhöhen, ohne Funktionalität zu verlieren?

- [ ] **requestAnimationFrame für Animationen:**

  ```javascript
  // ❌ Schlecht
  function animate() {
  	updatePosition();
  	setTimeout(animate, 16);
  }

  // ✅ Gut
  function animate() {
  	updatePosition();
  	requestAnimationFrame(animate);
  }
  ```

### ✅ Debounce/Throttle für Event-Handler implementieren

- [ ] **Scroll-Event-Handler debouncen:**

  ```javascript
  import { debounce } from 'lodash';

  const handleScroll = debounce(() => {
  	updateUI();
  }, 100);

  window.addEventListener('scroll', handleScroll);
  ```

- [ ] **Resize-Event-Handler debouncen:**

  ```javascript
  const handleResize = debounce(() => {
  	recalculateLayout();
  }, 200);

  window.addEventListener('resize', handleResize);
  ```

- [ ] **Input-Event-Handler debouncen:**

  ```javascript
  const handleInput = debounce((e) => {
  	search(e.target.value);
  }, 300);

  input.addEventListener('input', handleInput);
  ```

- [ ] **High-frequency Events throttlen:**

  ```javascript
  import { throttle } from 'lodash';

  const handleMouseMove = throttle((e) => {
  	updateCursor(e);
  }, 16); // Maximal 60x pro Sekunde

  window.addEventListener('mousemove', handleMouseMove);
  ```

### ✅ Cleanup beim Unmount sicherstellen

- [ ] **Alle useEffect-Hooks überprüfen:**

  ```javascript
  useEffect(() => {
  	// Timer erstellen
  	const timer = setInterval(callback, 1000);
  	const abortController = new AbortController();

  	fetch('/api/data', { signal: abortController.signal }).then((data) => setData(data));

  	window.addEventListener('resize', handleResize);

  	// ✅ Cleanup-Funktion MUSS vorhanden sein
  	return () => {
  		clearInterval(timer);
  		abortController.abort();
  		window.removeEventListener('resize', handleResize);
  	};
  }, []);
  ```

- [ ] **Event-Listener beim Unmount entfernen:**

  ```javascript
  useEffect(() => {
  	const handler = () => console.log('Clicked');
  	button.addEventListener('click', handler);

  	return () => {
  		button.removeEventListener('click', handler);
  	};
  }, []);
  ```

- [ ] **WebSocket-Verbindungen beim Unmount schließen:**

  ```javascript
  useEffect(() => {
  	const ws = new WebSocket('ws://...');
  	ws.onmessage = (msg) => handleMessage(msg);

  	return () => {
  		ws.close();
  	};
  }, []);
  ```

- [ ] **Subscriptions beim Unmount aufräumen:**

  ```javascript
  useEffect(() => {
  	const subscription = observable.subscribe((data) => {
  		updateState(data);
  	});

  	return () => {
  		subscription.unsubscribe();
  	};
  }, []);
  ```

### ✅ Allokationen reduzieren

- [ ] **Batch-Operationen:**

  ```javascript
  // ❌ Schlecht: Mehrere DOM-Updates
  element.style.width = '100px';
  element.style.height = '100px';
  element.style.background = 'red';

  // ✅ Gut: Batched mit CSS-Klasse
  element.classList.add('resized');

  // Oder mit requestAnimationFrame
  requestAnimationFrame(() => {
  	element.style.width = '100px';
  	element.style.height = '100px';
  	element.style.background = 'red';
  });
  ```

- [ ] **Objekte wiederverwenden:**

  ```javascript
  // ❌ Schlecht: Neues Objekt in jedem Render
  function MyComponent() {
  	const style = { color: 'red', fontSize: '16px' };
  	return <div style={style}>Text</div>;
  }

  // ✅ Gut: Style-Objekt außerhalb der Komponente
  const MY_STYLE = { color: 'red', fontSize: '16px' };

  function MyComponent() {
  	return <div style={MY_STYLE}>Text</div>;
  }
  ```

- [ ] **Schleifen vermeiden:**

  ```javascript
  // ❌ Schlecht: Berechnungen in jedem Render
  function MyComponent({ items }) {
  	const total = items.reduce((sum, item) => sum + item.value, 0);
  	const average = total / items.length;
  	const max = Math.max(...items.map((i) => i.value));

  	return (
  		<div>
  			{average}, {max}
  		</div>
  	);
  }

  // ✅ Gut: Berechnungen memoisieren
  function MyComponent({ items }) {
  	const stats = useMemo(
  		() => ({
  			total: items.reduce((sum, item) => sum + item.value, 0),
  			average: items.reduce((sum, item) => sum + item.value, 0) / items.length,
  			max: Math.max(...items.map((i) => i.value)),
  		}),
  		[items]
  	);

  	return (
  		<div>
  			{stats.average}, {stats.max}
  		</div>
  	);
  }
  ```

- [ ] **Array-Methoden optimieren:**

  ```javascript
  // ❌ Schlecht: Mehrere Durchgänge
  const active = items.filter((i) => i.active);
  const processed = active.map((i) => ({ ...i, processed: true }));
  const displayed = processed.filter((i) => i.display);

  // ✅ Gut: Ein Durchgang
  const displayed = items
  	.filter((i) => i.active && i.display)
  	.map((i) => ({ ...i, processed: true }));
  ```

### ✅ Weitere Optimierungen

- [ ] **Lazy Loading für große Listen:**

  ```javascript
  import { LazyLoad } from 'react-lazyload';

  function MyList({ items }) {
  	return items.map((item) => (
  		<LazyLoad key={item.id}>
  			<Item item={item} />
  		</LazyLoad>
  	));
  }
  ```

- [ ] **Virtual Scrolling für sehr lange Listen:**

  ```javascript
  import { FixedSizeList } from 'react-window';

  function MyList({ items }) {
  	return (
  		<FixedSizeList height={600} itemCount={items.length} itemSize={50} width="100%">
  			{({ index, style }) => (
  				<div style={style}>
  					<Item item={items[index]} />
  				</div>
  			)}
  		</FixedSizeList>
  	);
  }
  ```

- [ ] **Code Splitting:**

  ```javascript
  import { lazy, Suspense } from 'react';

  const HeavyComponent = lazy(() => import('./HeavyComponent'));

  function App() {
  	return (
  		<Suspense fallback={<div>Loading...</div>}>
  			<HeavyComponent />
  		</Suspense>
  	);
  }
  ```

- [ ] **Bilder optimieren:**

  ```javascript
   // Lazy Loading für Bilder
   <img src="image.jpg" loading="lazy" alt="Description" />

   // Responsive Bilder
   <picture>
     <source srcSet="image-800.webp" type="image/webp" media="(max-width: 800px)" />
     <source srcSet="image-1200.webp" type="image/webp" media="(max-width: 1200px)" />
     <img src="image-1200.jpg" alt="Description" loading="lazy" />
   </picture>
  ```

---

## Zusätzliche Ressourcen

### Interne Dokumentation

- [[CLAUDE-PERFORMANCE.md]] - Performance-Best Practices für Maestro
- [[scripts/performance-profiler.js]] - Timer Profiler Script

### Externe Ressourcen

- [Chrome DevTools Performance Panel](https://developer.chrome.com/docs/devtools/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Performance](https://web.dev/performance/)
- [JavaScript Garbage Collection](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

---

## Zusammenfassung

Performance-Debugging erfordert systematische Vorgehensweise:

1. **Profilieren** - Verwenden Sie DevTools und den Console Profiler
2. **Identifizieren** - Suchen Sie nach Timer-Hotspots und übermäßigen Allokationen
3. **Optimieren** - Wenden Sie die Checkliste der Common Fixes an
4. **Verifizieren** - Messen Sie die Verbesserung mit einem neuen Profil

Häufige Anti-Patterns vermeiden:

- ❌ Zu viele Timer mit kurzen Intervallen
- ❌ Fehlende Cleanup-Logik beim Unmount
- ❌ Unnötige Klon-Operationen
- ❌ Allokationen in hot paths
- ❌ String-Konkatenation in Schleifen

Best Practices befolgen:

- ✅ `requestAnimationFrame` für UI-Updates
- ✅ Debounce/Throttle für Event-Handler
- ✅ Cleanup in useEffect-Rückgabefunktion
- ✅ Memoisierung mit useMemo/useCallback
- ✅ Batch-Operationen und Objekt-Wiederverwendung

Mit diesen Werkzeugen und Mustern können Sie Performance-Probleme in Maestro und anderen Electron/React-Anwendungen effizient identifizieren und beheben.
