
// JS code to catch a form sumission and display the fields.

window.installBCCVLFormCatcher = function() {

    // find all the forms..
    forms = $('form');

    $.each(forms, function(formIndex, form) {

        $(form).submit( function(e) {
            // pop up a pre field
            $('body').append("<style class='bccvl-form-catcher'> \
                #bccvl-form-catcher {                    \
                    z-index: 999999999;                  \
                    position: absolute;                  \
                    left: 30px;                          \
                    right: 30px;                         \
                    top: 30px;                           \
                    overflow: scroll;                    \
                    background: rgba(50,50,50, 0.75);    \
                    padding: 2em;                        \
                    text-align: center;                  \
                    color: #fff;                         \
                }                                        \
                #bccvl-form-catcher button {             \
                    margin: 1em auto;                    \
                }                                        \
                #bccvl-form-catcher pre {                \
                    color: inherit;                      \
                    background-color: inherit;           \
                    padding: 0;                          \
                    margin: 0;                           \
                    border: none;                        \
                }                                        \
                #bccvl-form-catcher table {              \
                    border-collapse: collapse;           \
                    margin: 1em auto;                    \
                }                                        \
                #bccvl-form-catcher td, #bccvl-form-catcher th { \
                    font-family: monospace;              \
                    font-weight: normal;                 \
                    font-size: 110%;                     \
                    padding: 0.25em 1em;                 \
                    border: 1px solid #000;              \
                    text-align: left;                    \
                }                                        \
                #bccvl-form-catcher th {                 \
                    text-align: left;                    \
                    padding: 0.5em 1em;                  \
                }                                        \
                #bccvl-form-catcher hr {                 \
                    border-color: #000;                  \
                    margin: 0.1em;                       \
                }                                        \
            </style>");
            $('body').append('<div id="bccvl-form-catcher" class="bccvl-form-catcher"><button>close</button><table></table><button>close</button></div>');
            $('#bccvl-form-catcher button').click(function() { $('.bccvl-form-catcher').remove(); } );
            var $readout = $('#bccvl-form-catcher table');
            var formList = $(e.target).serializeArray();
            var formData = {};
            formList.forEach(function(formItem) {
                formData[formItem.name] = formData[formItem.name] || [];
                formData[formItem.name].push(formItem.value);
            });
            $.each(formData, function(name, values) {
                $readout.append(
                    '<tr>' +
                        '<th rowspan="' + values.length + '">' + name + '</th>' +
                        '<td><pre>' + values.join('</pre></td></tr><tr><td><pre>') + '</pre></td>' +
                    '</tr>'
                );
            });
            return false;
        });

    });
}


