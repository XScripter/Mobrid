(function() {
  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  Mobird.Template = Mobird.requireModule('modules/template');

  var templateSettings;

  QUnit.module('Template', {

    setup: function() {
      templateSettings = Mobird.clone(Mobird.Template.settings);
    },

    teardown: function() {
      Mobird.Template.settings = templateSettings;
    }

  });

  test('template', function() {
    var basicTemplate = Mobird.Template.compile("<%= thing %> is gettin' on my noives!");
    var result = basicTemplate({thing : 'This'});
    equal(result, "This is gettin' on my noives!", 'can do basic attribute interpolation');

    var sansSemicolonTemplate = Mobird.Template.compile('A <% this %> B');
    equal(sansSemicolonTemplate(), 'A  B');

    var backslashTemplate = Mobird.Template.compile('<%= thing %> is \\ridanculous');
    equal(backslashTemplate({thing: 'This'}), 'This is \\ridanculous');

    var escapeTemplate = Mobird.Template.compile('<%= a ? "checked=\\"checked\\"" : "" %>');
    equal(escapeTemplate({a: true}), 'checked="checked"', 'can handle slash escapes in interpolations.');

    var fancyTemplate = Mobird.Template.compile('<ul><% ' +
      '  for (var key in people) { ' +
      '%><li><%= people[key] %></li><% } %></ul>');
    result = fancyTemplate({people : {moe : 'Moe', larry : 'Larry', curly : 'Curly'}});
    equal(result, '<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>', 'can run arbitrary javascript in templates');

    var escapedCharsInJavascriptTemplate = Mobird.Template.compile('<ul><% Mobird.each(numbers.split("\\n"), function(item) { %><li><%= item %></li><% }) %></ul>');
    result = escapedCharsInJavascriptTemplate({numbers: 'one\ntwo\nthree\nfour'});
    equal(result, '<ul><li>one</li><li>two</li><li>three</li><li>four</li></ul>', 'Can use escaped characters (e.g. \\n) in JavaScript');

    var namespaceCollisionTemplate = Mobird.Template.compile('<%= pageCount %> <%= thumbnails[pageCount] %> <% Mobird.each(thumbnails, function(p) { %><div class="thumbnail" rel="<%= p %>"></div><% }); %>');
    result = namespaceCollisionTemplate({
      pageCount: 3,
      thumbnails: {
        1: 'p1-thumbnail.gif',
        2: 'p2-thumbnail.gif',
        3: 'p3-thumbnail.gif'
      }
    });
    equal(result, '3 p3-thumbnail.gif <div class="thumbnail" rel="p1-thumbnail.gif"></div><div class="thumbnail" rel="p2-thumbnail.gif"></div><div class="thumbnail" rel="p3-thumbnail.gif"></div>');

    var noInterpolateTemplate = Mobird.Template.compile('<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>');
    result = noInterpolateTemplate();
    equal(result, '<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>');

    var quoteTemplate = Mobird.Template.compile("It's its, not it's");
    equal(quoteTemplate({}), "It's its, not it's");

    var quoteInStatementAndBody = Mobird.Template.compile('<% ' +
      "  if(foo == 'bar'){ " +
      "%>Statement quotes and 'quotes'.<% } %>");
    equal(quoteInStatementAndBody({foo: 'bar'}), "Statement quotes and 'quotes'.");

    var withNewlinesAndTabs = Mobird.Template.compile('This\n\t\tis: <%= x %>.\n\tok.\nend.');
    equal(withNewlinesAndTabs({x: 'that'}), 'This\n\t\tis: that.\n\tok.\nend.');

    var template = Mobird.Template.compile('<i><%- value %></i>');
    result = template({value: '<script>'});
    equal(result, '<i>&lt;script&gt;</i>');

    var stooge = {
      name: 'Moe',
      template: Mobird.Template.compile("I'm <%= this.name %>")
    };
    equal(stooge.template(), "I'm Moe");

    template = Mobird.Template.compile('\n ' +
      '  <%\n ' +
      '  // a comment\n ' +
      '  if (data) { data += 12345; }; %>\n ' +
      '  <li><%= data %></li>\n '
    );
    equal(template({data : 12345}).replace(/\s/g, ''), '<li>24690</li>');

    Mobird.Template.settings = {
      evaluate    : /\{\{([\s\S]+?)\}\}/g,
      interpolate : /\{\{=([\s\S]+?)\}\}/g
    };

    var custom = Mobird.Template.compile('<ul>{{ for (var key in people) { }}<li>{{= people[key] }}</li>{{ } }}</ul>');
    result = custom({people : {moe : 'Moe', larry : 'Larry', curly : 'Curly'}});
    equal(result, '<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>', 'can run arbitrary javascript in templates');

    var customQuote = Mobird.Template.compile("It's its, not it's");
    equal(customQuote({}), "It's its, not it's");

    quoteInStatementAndBody = Mobird.Template.compile("{{ if(foo == 'bar'){ }}Statement quotes and 'quotes'.{{ } }}");
    equal(quoteInStatementAndBody({foo: 'bar'}), "Statement quotes and 'quotes'.");

    Mobird.Template.settings = {
      evaluate    : /<\?([\s\S]+?)\?>/g,
      interpolate : /<\?=([\s\S]+?)\?>/g
    };

    var customWithSpecialChars = Mobird.Template.compile('<ul><? for (var key in people) { ?><li><?= people[key] ?></li><? } ?></ul>');
    result = customWithSpecialChars({people : {moe : 'Moe', larry : 'Larry', curly : 'Curly'}});
    equal(result, '<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>', 'can run arbitrary javascript in templates');

    var customWithSpecialCharsQuote = Mobird.Template.compile("It's its, not it's");
    equal(customWithSpecialCharsQuote({}), "It's its, not it's");

    quoteInStatementAndBody = Mobird.Template.compile("<? if(foo == 'bar'){ ?>Statement quotes and 'quotes'.<? } ?>");
    equal(quoteInStatementAndBody({foo: 'bar'}), "Statement quotes and 'quotes'.");

    Mobird.Template.settings = {
      interpolate : /\{\{(.+?)\}\}/g
    };

    var mustache = Mobird.Template.compile('Hello {{planet}}!');
    equal(mustache({planet : 'World'}), 'Hello World!', 'can mimic mustache.js');

    var templateWithNull = Mobird.Template.compile('a null undefined {{planet}}');
    equal(templateWithNull({planet : 'world'}), 'a null undefined world', 'can handle missing escape and evaluate settings');
  });

  test('Mobird.Template.compile provides the generated function source, when a SyntaxError occurs', function() {
    try {
      Mobird.Template.compile('<b><%= if x %></b>');
    } catch (ex) {
      var source = ex.source;
    }
    ok(/__p/.test(source));
  });

  test('Mobird.Template.compile handles \\u2028 & \\u2029', function() {
    var tmpl = Mobird.Template.compile('<p>\u2028<%= "\\u2028\\u2029" %>\u2029</p>');
    strictEqual(tmpl(), '<p>\u2028\u2028\u2029\u2029</p>');
  });

  test('Mobird.Template.settings.variable', function() {
    var s = '<%=data.x%>';
    var data = {x: 'x'};
    var tmp = Mobird.Template.compile(s, {variable: 'data'});
    strictEqual(tmp(data), 'x');
    Mobird.Template.settings.variable = 'data';
    strictEqual(Mobird.Template.compile(s)(data), 'x');
  });

  test('#547 - Mobird.Template.settings is unchanged by custom settings.', function() {
    ok(!Mobird.Template.settings.variable);
    Mobird.Template.compile('', {}, {variable: 'x'});
    ok(!Mobird.Template.settings.variable);
  });

  test('#556 - undefined template variables.', function() {
    var template = Mobird.Template.compile('<%=x%>');
    strictEqual(template({x: null}), '');
    strictEqual(template({x: undefined}), '');

    var templateEscaped = Mobird.Template.compile('<%-x%>');
    strictEqual(templateEscaped({x: null}), '');
    strictEqual(templateEscaped({x: undefined}), '');

    var templateWithProperty = Mobird.Template.compile('<%=x.foo%>');
    strictEqual(templateWithProperty({x: {}}), '');
    strictEqual(templateWithProperty({x: {}}), '');

    var templateWithPropertyEscaped = Mobird.Template.compile('<%-x.foo%>');
    strictEqual(templateWithPropertyEscaped({x: {}}), '');
    strictEqual(templateWithPropertyEscaped({x: {}}), '');
  });

  test('interpolate evaluates code only once.', 2, function() {
    var count = 0;
    var template = Mobird.Template.compile('<%= f() %>');
    template({f: function(){ ok(!count++); }});

    var countEscaped = 0;
    var templateEscaped = Mobird.Template.compile('<%- f() %>');
    templateEscaped({f: function(){ ok(!countEscaped++); }});
  });

  test('#746 - Mobird.Template.compile settings are not modified.', 1, function() {
    var settings = {};
    Mobird.Template.compile('', null, settings);
    deepEqual(settings, {});
  });

  test('#779 - delimeters are applied to unescaped text.', 1, function() {
    var template = Mobird.Template.compile('<<\nx\n>>', null, {evaluate: /<<(.*?)>>/g});
    strictEqual(template(), '<<\nx\n>>');
  });

  test('Mobird.Template.addHelpers', function() {

    Mobird.Template.addHelpers({
      add: function(a, b) {
        return a + b;
      },
      subview: function(subviewName) {
        return "<div data-subview='" + subviewName + "'></div>";
      }
    });

    var s = '<%=add(a, b)%>';
    var data = {a: 1, b: 4};
    strictEqual(Mobird.Template.compile(s)(data), '5');

    var s1 = '<%=subview("test")%>';
    strictEqual(Mobird.Template.compile(s1)(), '<div data-subview=\'test\'></div>');
  });

}());
