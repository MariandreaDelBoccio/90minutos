/**
 * Vista previa: un producto a la vez + imagen o degradado real (no el string en texto).
 * Requiere decap-cms.js (define window.CMS, createClass, h).
 */
(function () {
  var CMS = window.CMS;
  if (!CMS || typeof CMS.registerPreviewTemplate !== "function") return;
  if (typeof createClass === "undefined" || typeof h === "undefined") return;

  function listLen(productos) {
    if (!productos) return 0;
    if (typeof productos.size === "number") return productos.size;
    var plain = productos.toJS && productos.toJS();
    return Array.isArray(plain) ? plain.length : 0;
  }

  function formatMoney(n) {
    if (n == null || n === "") return "—";
    var x = Number(n);
    if (isNaN(x)) return String(n);
    return x.toFixed(2) + " USD";
  }

  var ProductosPreview = createClass({
    displayName: "ProductosPreview",
    getInitialState: function () {
      return { index: 0 };
    },
    componentDidUpdate: function () {
      var productos = this.props.entry.getIn(["data", "productos"]);
      var len = listLen(productos);
      if (len === 0) return;
      if (this.state.index >= len) {
        this.setState({ index: len - 1 });
      }
    },
    onPickProduct: function (e) {
      this.setState({ index: parseInt(e.target.value, 10) || 0 });
    },
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var getAsset = props.getAsset;
      var productos = entry.getIn(["data", "productos"]);
      var len = listLen(productos);

      if (len === 0) {
        return h(
          "div",
          { className: "productos-preview productos-preview--empty" },
          h("p", {}, "No hay productos. Añade uno en el formulario de la izquierda.")
        );
      }

      var idx = Math.min(Math.max(0, this.state.index), len - 1);
      var p = productos.get(idx);

      var team = p.get("team") || "";
      var club = p.get("club") || "";
      var season = p.get("season") || "";
      var league = p.get("league") || "";
      var badge = p.get("badge");
      var price = p.get("price");
      var pricePlayer = p.get("pricePlayer");
      var oldPrice = p.get("oldPrice");
      var imgPath = p.get("image");
      var bgCss =
        p.get("bg") || "linear-gradient(135deg,#1f2937,#111827 60%,#4b5563)";

      var sizesRaw = p.get("sizes");
      var sizes = sizesRaw && sizesRaw.toJS ? sizesRaw.toJS() : sizesRaw;
      if (!Array.isArray(sizes)) sizes = [];

      var oosRaw = p.get("outOfStock");
      var oos = oosRaw && oosRaw.toJS ? oosRaw.toJS() : oosRaw;
      if (!Array.isArray(oos)) oos = [];

      var playersRaw = p.get("players");
      var players = playersRaw && playersRaw.toJS ? playersRaw.toJS() : playersRaw;
      if (!Array.isArray(players)) players = [];

      var visual;
      if (imgPath) {
        var asset = getAsset(imgPath);
        var src = asset && asset.toString ? asset.toString() : String(imgPath);
        visual = h("img", {
          className: "productos-preview__img",
          src: src,
          alt: team || "Producto",
        });
      } else {
        visual = h("div", {
          className: "productos-preview__gradient",
          style: { background: String(bgCss) },
          "aria-hidden": "true",
        });
      }

      var options = [];
      for (var i = 0; i < len; i++) {
        var item = productos.get(i);
        var label =
          (item.get("team") || item.get("id") || "Producto " + (i + 1)) + "";
        options.push(h("option", { key: i, value: String(i) }, label));
      }

      var metaRows = [
        h("div", { className: "productos-preview__row", key: "club" }, [
          h("span", { className: "productos-preview__k" }, "Club"),
          h("span", { className: "productos-preview__v" }, club || "—"),
        ]),
        h("div", { className: "productos-preview__row", key: "league" }, [
          h("span", { className: "productos-preview__k" }, "Liga"),
          h("span", { className: "productos-preview__v" }, league || "—"),
        ]),
        h("div", { className: "productos-preview__row", key: "season" }, [
          h("span", { className: "productos-preview__k" }, "Temporada"),
          h("span", { className: "productos-preview__v" }, season || "—"),
        ]),
      ];

      var priceLines = [
        h("div", { className: "productos-preview__price-line", key: "fan" }, [
          h("span", { className: "productos-preview__k" }, "Fan"),
          h("span", { className: "productos-preview__price" }, formatMoney(price)),
        ]),
        h("div", { className: "productos-preview__price-line", key: "player" }, [
          h("span", { className: "productos-preview__k" }, "Player"),
          h("span", { className: "productos-preview__price" }, formatMoney(pricePlayer)),
        ]),
      ];
      if (oldPrice != null && oldPrice !== "" && Number(oldPrice) > 0) {
        priceLines.unshift(
          h("div", { className: "productos-preview__old", key: "old" }, [
            "Antes ",
            h("span", { className: "productos-preview__strike" }, formatMoney(oldPrice)),
          ])
        );
      }
      var priceBlock = h("div", { className: "productos-preview__prices" }, priceLines);

      var badgeEl =
        badge && String(badge).trim()
          ? h("span", { className: "productos-preview__badge" }, String(badge))
          : null;

      var playersEl =
        players.length > 0
          ? h(
              "div",
              { className: "productos-preview__players" },
              [
                h("div", { className: "productos-preview__players-title", key: "t" }, "Jugadores sugeridos"),
              ].concat(
                players.map(function (pl, j) {
                  var name = pl.name || "";
                  var num = pl.number != null ? String(pl.number) : "";
                  return h(
                    "div",
                    { className: "productos-preview__player", key: j },
                    name + (num ? " #" + num : "")
                  );
                })
              )
            )
          : null;

      return h("div", { className: "productos-preview" }, [
        h(
          "div",
          { className: "productos-preview__toolbar", key: "tb" },
          [
            h("label", { className: "productos-preview__label", key: "l" }, "Vista previa de"),
            h(
              "select",
              {
                className: "productos-preview__select",
                value: String(idx),
                onChange: this.onPickProduct,
                key: "s",
              },
              options
            ),
            h(
              "span",
              { className: "productos-preview__hint", key: "h" },
              len + " en catálogo · solo se muestra uno"
            ),
          ]
        ),
        h(
          "article",
          { className: "productos-preview__card", key: "card" },
          [
            h(
              "div",
              { className: "productos-preview__visual", key: "vis" },
              [visual, badgeEl].filter(Boolean)
            ),
            h("div", { className: "productos-preview__body", key: "body" }, [
              h("h2", { className: "productos-preview__title", key: "title" }, team || "Sin nombre"),
              h("div", { className: "productos-preview__meta", key: "meta" }, metaRows),
              priceBlock,
              h("div", { className: "productos-preview__sizes", key: "sz" }, [
                h("span", { className: "productos-preview__k" }, "Tallas"),
                h("span", { className: "productos-preview__v" }, sizes.length ? sizes.join(", ") : "—"),
              ]),
              oos.length > 0
                ? h("div", { className: "productos-preview__oos", key: "oos" }, [
                    h("span", { className: "productos-preview__k" }, "Agotadas"),
                    h("span", { className: "productos-preview__v productos-preview__v--warn" }, oos.join(", ")),
                  ])
                : null,
              playersEl,
            ].filter(Boolean))
          ]
        ),
      ]);
    },
  });

  CMS.registerPreviewTemplate("productos", ProductosPreview);
})();
