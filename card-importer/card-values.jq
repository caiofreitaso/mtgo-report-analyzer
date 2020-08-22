def join_lowercase: map("'" + (. | ascii_downcase) + "'") | join(",");

"INSERT INTO card(name,types,colors,effective_colors,cmc,effective_cmc) VALUES\n" +
(.data.cards
| map(select(.supertypes | contains(["Basic"]) | not))
| map("("
  + "'" + (.name | gsub("'";"''")) + "',"
  + "ARRAY[" + (.supertypes + .types | join_lowercase) + "]::card_type[],"
  + "ARRAY[" +
    (
      .colors
      | map(
        if . == "W" then "white"
        elif . == "U" then "blue"
        elif . == "B" then "black"
        elif . == "G" then "green"
        elif . == "R" then "red"
        else ""
        end
      )
      | join_lowercase
    ) + "]::card_color[],"
  + "ARRAY["
    + (if .manaCost == null then ""
      else
        if .manaCost | contains("{W}") and contains("{U}") and contains("{B}") and contains("{G}") and contains("{R}") then "'white','blue','black','green','red'"
        elif .manaCost | contains("{W}") and contains("{U}") and contains("{B}") and contains("{G}") then "'white','blue','black','green'"
        elif .manaCost | contains("{W}") and contains("{U}") and contains("{B}") and contains("{R}") then "'white','blue','black','red'"
        elif .manaCost | contains("{W}") and contains("{U}") and contains("{G}") and contains("{R}") then "'white','blue','green','red'"
        elif .manaCost | contains("{W}") and contains("{B}") and contains("{G}") and contains("{R}") then "'white','black','green','red'"
        elif .manaCost | contains("{U}") and contains("{B}") and contains("{G}") and contains("{R}") then "'blue','black','green','red'"
        elif .manaCost | contains("{W}") and contains("{U}") and contains("{B}") then "'white','blue','black'"
        elif .manaCost | contains("{W}") and contains("{U}") and contains("{G}") then "'white','blue','green'"
        elif .manaCost | contains("{W}") and contains("{U}") and contains("{R}") then "'white','blue','red'"
        elif .manaCost | contains("{W}") and contains("{B}") and contains("{G}") then "'white','black','green'"
        elif .manaCost | contains("{W}") and contains("{B}") and contains("{R}") then "'white','black','red'"
        elif .manaCost | contains("{W}") and contains("{G}") and contains("{R}") then "'white','green','red'"
        elif .manaCost | contains("{U}") and contains("{B}") and contains("{G}") then "'blue','black','green'"
        elif .manaCost | contains("{U}") and contains("{B}") and contains("{R}") then "'blue','black','red'"
        elif .manaCost | contains("{B}") and contains("{G}") and contains("{R}") then "'black','green','red'"
        elif .manaCost | contains("{W}") and contains("{U}") then "'white','blue'"
        elif .manaCost | contains("{W}") and contains("{B}") then "'white','black'"
        elif .manaCost | contains("{W}") and contains("{G}") then "'white','green'"
        elif .manaCost | contains("{W}") and contains("{R}") then "'white','red'"
        elif .manaCost | contains("{U}") and contains("{B}") then "'blue','black'"
        elif .manaCost | contains("{U}") and contains("{G}") then "'blue','green'"
        elif .manaCost | contains("{U}") and contains("{R}") then "'blue','red'"
        elif .manaCost | contains("{B}") and contains("{G}") then "'black','green'"
        elif .manaCost | contains("{B}") and contains("{R}") then "'black','red'"
        elif .manaCost | contains("{G}") and contains("{R}") then "'green','red'"
        elif .manaCost | contains("{W}") then "'white'"
        elif .manaCost | contains("{U}") then "'blue'"
        elif .manaCost | contains("{B}") then "'black'"
        elif .manaCost | contains("{G}") then "'green'"
        elif .manaCost | contains("{R}") then "'red'"
        else ""
        end
      end)
    + "]::card_color[],"
  + (.convertedManaCost | tostring) + ","
  + (
      if .manaCost == null then "0"
      else (.convertedManaCost - (.manaCost | [match("P";"g")] | length) | tostring)
      end
    )
  + ")")
| join(",\n"))
+ "ON CONFLICT DO NOTHING;"
