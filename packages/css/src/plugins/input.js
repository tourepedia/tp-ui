module.exports = function addInputComponentPlugin({ addComponents, theme }) {
  const inputs = {
    ".input": {
      background: theme("backgroundColor.white"),
      padding: `${theme("padding.ie-y")} ${theme("padding.ie-x")}`,
      borderRadius: theme("borderRadius.default"),
      border: `${theme("borderWidth.default")} solid ${theme(
        "borderColor.gray.500"
      )}`,
      display: "block",
      lineHeight: 1.5,
      maxWidth: "100%",
      boxShadow: theme("boxShadow.inner"),
      "&:focus": {
        outline: "none",
        borderColor: theme("borderColor.primary.600"),
        boxShadow: `${theme("boxShadow.inner")}, ${theme("boxShadow.outline")}`,
      },
      "&[type='checkbox'], &[type='radio']": {
        display: "inline-block",
        padding: 0,
      },
      "&[type='radio']": {
        borderRadius: "100%",
      },
      "&[type='email'], &[type='text'], &[type='password']": {
        width: "100%",
        maxWidth: theme("maxWidth.sm"),
      },
      "textarea&": {
        lineHeight: "1.5",
        height: "auto",
        minHeight: "100px",
        minWidth: "200px",
        width: "100%",
      },
      "select&": {
        height: `calc(2 * ${theme("padding.ie-y")} + 1.5rem + 2px)`,
        lineHeight: 1,
      },
      "&.has-error": {
        borderColor: theme("borderColor.red.700"),
      },
      "&:disabled, &[readonly]": {
        background: theme("backgroundColor.gray.100"),
        cursor: "not-allowed",
        opacity: 0.8,
      },
      "&[readonly]": {
        pointerEvents: "none",
      },
      "&-group": {
        borderRadius: theme("borderRadius.default"),
        width: "fit-content",
        display: "flex",
        alignItems: "stretch",
        lineHeight: 1.5,
        "& > *": {
          borderRadius: 0,
        },
        "& > * + *": {
          marginLeft: `-${theme("borderWidth.default")}`,
        },
        "& > *:focus": {
          zIndex: 2,
        },
        "& > *:first-child": {
          borderTopLeftRadius: theme("borderRadius.default"),
          borderBottomLeftRadius: theme("borderRadius.default"),
        },
        "& > *:last-child": {
          borderTopRightRadius: theme("borderRadius.default"),
          borderBottomRightRadius: theme("borderRadius.default"),
        },
        [`&-addon`]: {
          padding: theme("padding.ie-y"),
          border: `${theme("borderWidth.default")} solid ${theme(
            "borderColor.gray.500"
          )}`,
        },
        "&.has-error > *": {
          borderColor: "red",
        },
      },
    },
    ".form-group": {
      marginBottom: theme("margin.6"),
      "& > label": {
        fontSize: theme("fontSize.sm"),
      },
      "& > label + .input, & > label + .input-group": {
        marginTop: theme("margin.1"),
      },
      "& > .input + label, & > .input-group + label": {
        marginLeft: theme("margin.2"),
      },
      "&.has-error .input, &.has-error .input-group > *": {
        borderColor: theme("borderColor.red.700"),
      },
      "&.has-error .error-message": {
        display: "block",
        width: "fit-content",
        backgroundColor: theme("backgroundColor.red.700"),
        color: theme("textColor.white"),
        marginTop: theme("margin.2"),
        borderRadius: theme("borderRadius.default"),
        fontSize: theme("fontSize.sm"),
        padding: `${theme("padding.1")} ${theme("padding.3")}`,
      },
    },
  }
  addComponents(inputs)
}
