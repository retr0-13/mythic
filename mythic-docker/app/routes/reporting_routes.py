from app import mythic, links
from sanic import response
from jinja2 import Environment, PackageLoader
from sanic_jwt.decorators import scoped, inject_user
from app.routes.routes import respect_pivot, getSchemes

env = Environment(loader=PackageLoader("app", "templates"), autoescape=True)


@mythic.route("/reporting/full_timeline")
@inject_user()
@scoped("auth:user")
async def ui_full_timeline(request, user):
    template = env.get_template("reporting_full_timeline.html")
    content = template.render(
        links=await respect_pivot(links, request),
        name=user["username"],
        ** await getSchemes(request),
        config=user["ui_config"],
        view_utc_time=user["view_utc_time"],
        view_mode=user["view_mode"],
    )
    return response.html(content)


@mythic.route("/reporting/attack_mapping")
@inject_user()
@scoped("auth:user")
async def attack_mappings(request, user):
    template = env.get_template("mitre_attack_mappings.html")
    content = template.render(
        links=await respect_pivot(links, request),
        name=user["username"],
        ** await getSchemes(request),
        config=user["ui_config"],
        view_utc_time=user["view_utc_time"],
        view_mode=user["view_mode"],
    )
    return response.html(content)


links["full_timeline"] = mythic.url_for("ui_full_timeline")
links["attack_mapping"] = mythic.url_for("attack_mappings")
