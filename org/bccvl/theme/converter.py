from z3c.form.converter import (
    IntegerDataConverter,
    DecimalDataConverter,
    FormatterValidationError,
)
from decimal import Decimal, InvalidOperation

class RemoveSeparatorIntDataConverter(IntegerDataConverter):
    """
    Custom converter to bypass locale-formatting of numbers & the
    addition of thousands-separators, to work with HTML5 number inputs
    """
    def toWidgetValue(self, value):
        if value is self.field.missing_value:
            return u''
        return unicode(value)

class WorkingDecimalDataConverter(DecimalDataConverter):
    """
    Custom converter to bypass the locale limitation of 3 decimal places
    """
    def toWidgetValue(self, value):
        """See interfaces.IDataConverter"""
        if value is self.field.missing_value:
            return u''
        return unicode(value)

    def toFieldValue(self, value):
        """See interfaces.IDataConverter"""
        if value == u'':
            return self.field.missing_value
        try:
            return Decimal(value)
        except InvalidOperation:
            raise FormatterValidationError(self.errorMessage, value)
