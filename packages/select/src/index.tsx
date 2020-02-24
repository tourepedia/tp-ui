import React, { useState, useEffect, useRef, useCallback } from "react"
import { Omit } from "utility-types"
import { contains, ownerDocument, listen } from "@tourepedia/dom-helpers"
import classNames from "classnames"
import { Input } from "@tourepedia/input"

import createCache from "./cache"

const Cache = createCache()

function Loader() {
  return <div className="select__loader" />
}

function defaultCreateOptionLabel(label: string): React.ReactNode {
  return label
}

function OptionItemRenderer({
  option,
  labelKey,
  created,
  createOptionLabel,
}: {
  option: any
  labelKey: string
  created?: boolean
  createOptionLabel: typeof defaultCreateOptionLabel
}) {
  const label = getLabelForOption(option, labelKey)
  return <span>{created ? createOptionLabel(label) : label}</span>
}

type TOption = any

export interface SelectProps {
  className?: string
  creatable?: boolean
  disabled?: boolean
  fetchOnMount?: boolean
  label?: React.ReactNode
  labelKey?: string
  multiple?: boolean
  name?: string
  onBlur?: (e: any) => void
  onChange?: (value: TOption | Array<TOption>, name: string) => void
  onFocus?: (e: any) => void
  onQuery?: (query: string) => void
  options?: Array<TOption>
  placeholder?: string
  query?: string
  required?: boolean
  searchable?: boolean
  value?: TOption | Array<TOption>
  isLoading?: boolean
  optionRenderer?: typeof OptionItemRenderer
  inline?: boolean
  onCreateNew?: (query: string) => void | Promise<any> | any
  createOptionLabel?: (query: string) => React.ReactNode
  filterOptions?: (
    options?: Array<TOption>,
    query?: string
  ) => Array<TOption> | undefined
}

export function Select({
  className = "",
  creatable = false,
  disabled = false,
  fetchOnMount,
  label,
  labelKey = "name",
  multiple,
  name: propName,
  onBlur,
  onChange,
  onFocus,
  onQuery,
  options = [],
  placeholder = "Type to search...",
  query = "",
  required,
  searchable = true,
  value,
  isLoading,
  optionRenderer: OptionRenderer = OptionItemRenderer,
  inline = false,
  onCreateNew,
  createOptionLabel = defaultCreateOptionLabel,
  filterOptions,
}: SelectProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, changeFocusState] = useState<boolean>(false)
  useEffect(() => {
    if (fetchOnMount) {
      onQuery && onQuery(query || "")
    }
  }, [fetchOnMount])
  const [focusedOption, changeFocusedOption] = useState<number | undefined>(
    undefined
  )
  const name: string = propName || (multiple ? "select[]" : "select")
  if (filterOptions && searchable) {
    options = filterOptions(options, query) || []
  }
  if (creatable && query && query.trim() && !isLoading) {
    // check if we have an exact match
    const exactMatch = (options || []).some((option: any) => {
      return (
        String(getLabelForOption(option, labelKey)).toLowerCase() ===
        query.trim().toLowerCase()
      )
    })
    if (!exactMatch) {
      options = (options || []).concat([
        {
          id: query.trim(),
          name: query.trim(),
          __created: true,
        },
      ])
    }
  }
  if (value) {
    let moreOptions = []
    if (Array.isArray(value)) {
      moreOptions = value
    } else {
      moreOptions = [value]
    }
    // only push the more options if they are not already present in
    // the options list
    moreOptions = moreOptions.filter(
      moreOption =>
        !options.some(option => matchOptions(option, moreOption, labelKey))
    )
    options = options.concat(moreOptions)
  }
  const setIsFouced = React.useCallback(
    (isFocused: boolean) => {
      changeFocusState(isFocused)
      if (!isFocused) {
        onBlur && onBlur({ target: { name } })
      }
    },
    [onBlur, changeFocusState]
  )
  // handle the focused state
  useEffect(() => {
    const document = ownerDocument()
    if (!document || disabled || !groupRef.current) {
      return () => {}
    }
    function handleClick(e: any) {
      const container = groupRef.current
      if (contains(container, e.target)) {
        switch (e.key) {
          case undefined:
          case "Tab":
          case "ArrowDown":
          case "ArrowUp":
            if (!isFocused) {
              setIsFouced(true)
            }
        }
      } else if (isFocused) {
        setIsFouced(false)
      }
    }
    const removeListeners = [
      listen(document, "click", handleClick),
      listen(document, "keyup", handleClick),
      listen(document, "focus", handleClick),
    ]
    return () => {
      removeListeners.forEach(fn => fn())
    }
  }, [isFocused, groupRef.current])
  // handle the keyboad navigation
  useEffect(() => {
    const document = ownerDocument()
    // handle the base cases where no need to manage the keyboad focus stuff
    if (!isFocused || !document || disabled || !options || !options.length) {
      changeFocusedOption(undefined)
      return () => {}
    }
    // if no option is focused
    // focus the first selected option or first option if no option is selected
    if (focusedOption === undefined) {
      if (!value || (Array.isArray(value) && !value.length)) {
        changeFocusedOption(0)
      } else {
        const selectedOptionIndex = options.findIndex(o =>
          Array.isArray(value)
            ? value.some(v => matchOptions(v, o, labelKey))
            : matchOptions(value, o, labelKey)
        )
        changeFocusedOption(selectedOptionIndex)
      }
    }
    function handleKeyDown(e: any) {
      const { key } = e
      const numberOfOptions = options.length
      switch (key) {
        case "ArrowDown":
          changeFocusedOption(((focusedOption || 0) + 1) % numberOfOptions)
          break
        case "ArrowUp":
          changeFocusedOption(
            (() => {
              const x = ((focusedOption || 0) - 1) % numberOfOptions
              return x < 0 ? x + numberOfOptions : x
            })()
          )
          break
        case "Enter":
          e.preventDefault()
          e.stopPropagation()
          const option = options[focusedOption || 0]
          const checked = value
            ? Array.isArray(value)
              ? value.some(v => matchOptions(v, option, labelKey))
              : matchOptions(value, option, labelKey)
            : false
          handleOptionClick(option, !checked)
          break
        default:
          break
      }
    }
    return listen(document, "keydown", handleKeyDown)
  }, [isFocused, focusedOption, options, value])

  // handle the option click
  const handleOptionClick = React.useCallback(
    (option: any, checked: boolean) => {
      Promise.resolve()
        .then(() => {
          if (onCreateNew && option && option.__created) {
            const newOption = onCreateNew(option.name)
            return Promise.resolve(newOption)
          }
          return option
        })
        .then((option: any) => {
          if (!option) return
          if (onChange) {
            const newValues = checked
              ? multiple
                ? (value || []).concat([option])
                : option
              : multiple
              ? (value || []).filter(
                  (v: any) => !matchOptions(v, option, labelKey)
                )
              : undefined
            onChange(newValues, name)
            if (!multiple && newValues) {
              setTimeout(() => {
                setIsFouced(false)
              })
            }
          }
        })
    },
    [onChange, multiple, value, setIsFouced]
  )
  return (
    <div
      className={classNames(
        "select",
        {
          "select-inline": inline,
          "select-not-searchable": !searchable,
        },
        className
      )}
      data-focused={isFocused}
    >
      <div role="group" ref={groupRef}>
        {label ? <label htmlFor={name}>{label}</label> : null}
        {inline && !searchable ? null : (
          <Input
            type="search"
            value={
              (isFocused
                ? query
                : !multiple && value
                ? getLabelForOption(value, labelKey)
                : "") || ""
            }
            disabled={disabled}
            onChange={e => {
              onQuery && onQuery(e.currentTarget.value)
            }}
            id={name}
            onFocus={onFocus}
            required={required}
            readOnly={!searchable}
            placeholder={placeholder}
            aria-haspopup={true}
            aria-autocomplete={searchable ? "inline" : "list"}
            autoComplete="off"
            ref={inputRef}
          />
        )}
        {isLoading ? !searchable && options.length ? null : <Loader /> : null}
        <ol role="listbox" aria-multiselectable={multiple}>
          {isFocused && options.length === 0 ? (
            <li role="option" aria-readonly={true}>
              Type to search...
            </li>
          ) : null}
          {options.map((option, i) => {
            const checked = value
              ? multiple
                ? (value || []).some((v: any) =>
                    matchOptions(v, option, labelKey)
                  )
                : matchOptions(value, option)
              : false
            return (
              <Option
                key={getMatcherValueForOption(option)}
                checked={checked}
                focused={i === focusedOption}
                title={
                  typeof option === "object"
                    ? option.title || option.description
                    : getLabelForOption(option, labelKey)
                }
                disabled={disabled}
                onClick={checked => {
                  handleOptionClick(option, checked)
                }}
                onMouseOver={() => {
                  changeFocusedOption(i)
                }}
              >
                <div className="flex items-center">
                  <input
                    readOnly
                    type={multiple ? "checkbox" : "radio"}
                    checked={checked}
                    className="mr-2"
                    tabIndex={-1}
                  />
                  <div>
                    <OptionRenderer
                      option={option}
                      created={option.__created}
                      labelKey={labelKey}
                      createOptionLabel={createOptionLabel}
                    />
                  </div>
                </div>
              </Option>
            )
          })}
        </ol>
      </div>
      {value && multiple && !inline ? (
        <ul className="selected-list">
          {value.map((v: any) => (
            <li
              key={getMatcherValueForOption(v)}
              title="Click to unselect"
              role="button"
              onClick={() =>
                !disabled &&
                onChange &&
                onChange(
                  value.filter(
                    (val: any) => !matchOptions(val, v, labelKey)
                  ) as any,
                  name
                )
              }
            >
              <div className="flex items-center">
                <input
                  readOnly
                  type="checkbox"
                  checked
                  className="mr-2"
                  tabIndex={-1}
                />
                <div>{getLabelForOption(v, labelKey)}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

interface OptionProps extends Omit<React.HTMLProps<HTMLLIElement>, "onClick"> {
  focused?: boolean
  checked?: boolean
  disabled?: boolean
  onClick?: (checked: boolean) => void
}

function Option({
  focused,
  checked,
  onClick,
  disabled,
  ...props
}: OptionProps) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (ref.current && focused) {
      ref.current.scrollIntoView &&
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
    }
  }, [focused, ref.current])
  return (
    <li
      ref={ref}
      role="option"
      aria-selected={checked}
      data-focused={focused}
      tabIndex={-1}
      onClick={() => !disabled && onClick && onClick(!checked)}
      {...props}
    />
  )
}

export interface AsyncProps
  extends Omit<SelectProps, "onQuery" | "options" | "query">,
    Partial<Pick<SelectProps, "onQuery" | "options" | "query">> {
  fetch: (query: string) => Promise<any[]>
  debounceBy?: number
  cacheKey?: string
}

export function Async({
  fetch,
  debounceBy = 300,
  cacheKey,
  ...otherProps
}: AsyncProps) {
  const [state, setState] = useState<{
    query: string
    isLoading: boolean
    options: Array<any>
  }>(() => ({
    query: "",
    isLoading: false,
    options: cacheKey ? Cache.get(cacheKey) : [],
  }))
  const lastDeboundeHandler = useRef<number>()
  useEffect(() => {
    return () => {
      typeof window !== "undefined" &&
        window.clearTimeout(lastDeboundeHandler.current)
    }
  }, [lastDeboundeHandler])

  const fetchOptions = useCallback(
    (query: string) => {
      setState(state => ({
        ...state,
        isLoading: true,
        options: cacheKey ? Cache.get(cacheKey) : state.options,
        query,
      }))
      clearTimeout(lastDeboundeHandler.current)
      lastDeboundeHandler.current = window.setTimeout(() => {
        fetch(query)
          .then(options => {
            if (cacheKey) {
              Cache.set(cacheKey, options)
            }
            setState(state => ({
              ...state,
              isLoading: false,
              options,
            }))
          })
          .catch(error => {
            setState(state => ({
              ...state,
              isLoading: false,
            }))
            return Promise.reject(error)
          })
      }, debounceBy)
    },
    [fetch, lastDeboundeHandler, debounceBy]
  )
  const { options, query, isLoading } = state
  return (
    <Select
      options={options}
      query={query}
      isLoading={isLoading}
      onQuery={fetchOptions}
      filterOptions={undefined}
      {...otherProps}
    />
  )
}

function withFilterManagement(Select: React.ComponentType<SelectProps>) {
  return function WithQuery(props: SelectProps) {
    const { searchable, labelKey = "name" } = props
    const filterOptions = useCallback(
      (options?: Array<TOption>, query?: string) => {
        if (!options || !query || searchable === false) return options
        const searchQuery: string = query.toLowerCase().trim()
        return options.filter(o =>
          (
            getLabelForOption(o, labelKey) ||
            getLabelForOption(o, "name") ||
            getLabelForOption(o, "description") ||
            getLabelForOption(o, "title") ||
            ""
          )
            .toLowerCase()
            .includes(searchQuery)
        )
      },
      [searchable, labelKey]
    )
    return <Select filterOptions={filterOptions} {...props} />
  }
}

function withQueryManagement(Select: React.ComponentType<SelectProps>) {
  return function WithQuery(props: SelectProps) {
    const [query, setQuery] = useState<string>("")
    if (props.searchable !== false) {
      props = {
        query,
        onQuery: setQuery,
        ...props,
      }
    }
    return <Select {...props} />
  }
}

export default withQueryManagement(withFilterManagement(Select))

/**
 * Match two options and verify if they are equal or not
 */
function matchOptions(
  optionA?: any,
  optionB?: any,
  labelKey: string = "name"
): boolean {
  if (!optionA || !optionB) return false
  return (
    getMatcherValueForOption(optionA, labelKey) ===
    getMatcherValueForOption(optionB, labelKey)
  )
}

/**
 * Get the matcher value for option
 * option.id is given the highest priority and then we will simply get the label
 */
function getMatcherValueForOption(
  option: any,
  labelKey: string = "name"
): string {
  if (!option) return ""
  const optionType = typeof option
  if (optionType === "object" && option.id) return String(option.id)
  return getLabelForOption(option, labelKey)
}

/**
 * Get the label for option
 */
function getLabelForOption(option?: any, labelKey: string = "name"): string {
  if (!option) return ""
  const optionType = typeof option
  switch (optionType) {
    case "string":
      return String(option)
    case "number":
      return String(option)
    case "object":
      return String((option as any)[labelKey])
    default:
      return ""
  }
}
