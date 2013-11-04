from z3c.form.converter import IntegerDataConverter

class RemoveSeparatorIntDataConverter(IntegerDataConverter):
    """
    Custom converter to bypass locale-formatting of numbers & the
    addition of thousands-separators, to work with HTML5 number inputs
    """
    def toWidgetValue(self, value):
        if value is self.field.missing_value:
            return u''
        return unicode(value)
