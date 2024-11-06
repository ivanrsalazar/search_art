# artworks/templatetags/custom_filters.py
from django import template

register = template.Library()

@register.filter
def cutafter(value, delimiter):
    """Remove everything after the specified delimiter, including the delimiter."""
    return value.split(delimiter)[0] if delimiter in value else value

@register.filter
def split_at(value, char):
    """Split text at the first occurrence of the specified character, including the character in the second part."""
    parts = value.split(char, 1)
    if len(parts) > 1:
        return [parts[0], char + parts[1]]  # Include the character at the start of the second part
    return [parts[0], '']