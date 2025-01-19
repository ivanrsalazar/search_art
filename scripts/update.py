from artworks.models import Artwork

def update_artsy_artworks_year():
    # Filter artworks with source "Artsy"
    artsy_artworks = Artwork.objects.filter(api_source="Artsy")

    for artwork in artsy_artworks:
        artwork_title = artwork.title

        # Check if the title contains '(' and split to extract the date
        if '(' in artwork_title:
            try:
                # Split the title and extract the date
                updated_title, title_date = (
                    artwork_title.split('(')[0].strip(),
                    artwork_title.split('(')[1][:-1].strip(),
                )
                
                # Update the title and year fields
                artwork.title = updated_title
                artwork.year = title_date
                
                # Save the updated artwork
                artwork.save()
                print(f"Updated: {artwork.image_url} -> Title: {updated_title}, Year: {title_date}")
            except Exception as e:
                print(f"Error updating artwork {artwork.image_url}: {e}")

    print("Finished updating Artsy artworks.")